const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Expense = require('../models/Expense');
const JobSheet = require('../models/JobSheet');

// Get revenue report
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, period = 'daily' } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      // Default to current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter = {
        date: { $gte: startOfMonth, $lte: endOfMonth }
      };
    }

    const appointments = await Appointment.find({
      ...dateFilter,
      status: 'completed',
      paymentStatus: 'paid'
    }).populate('customer', 'name');

    // Group by period
    const revenueByPeriod = {};
    let totalRevenue = 0;

    appointments.forEach(apt => {
      const date = new Date(apt.date);
      let key;

      if (period === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!revenueByPeriod[key]) {
        revenueByPeriod[key] = 0;
      }
      revenueByPeriod[key] += apt.totalAmount;
      totalRevenue += apt.totalAmount;
    });

    const data = Object.entries(revenueByPeriod).map(([period, revenue]) => ({
      period,
      revenue,
      count: appointments.filter(apt => {
        const date = new Date(apt.date);
        let aptKey;
        if (period === 'daily') {
          aptKey = date.toISOString().split('T')[0];
        } else if (period === 'weekly') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          aptKey = weekStart.toISOString().split('T')[0];
        } else if (period === 'monthly') {
          aptKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }
        return aptKey === period;
      }).length
    }));

    res.json({
      totalRevenue,
      data,
      summary: {
        totalAppointments: appointments.length,
        averagePerAppointment: appointments.length > 0 ? totalRevenue / appointments.length : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get expenses report
const getExpensesReport = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (category) {
      query.category = category;
    }

    const expenses = await Expense.find(query)
      .populate('addedBy', 'name')
      .sort({ date: -1 });

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Group by category
    const byCategory = {};
    expenses.forEach(exp => {
      if (!byCategory[exp.category]) {
        byCategory[exp.category] = 0;
      }
      byCategory[exp.category] += exp.amount;
    });

    res.json({
      totalExpenses,
      expenses,
      byCategory: Object.entries(byCategory).map(([category, amount]) => ({
        category,
        amount
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get customer report
const getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const customers = await Customer.find(dateFilter).sort({ createdAt: -1 });

    // Get appointment counts per customer
    const customerIds = customers.map(c => c._id);
    const appointmentCounts = await Appointment.aggregate([
      { $match: { customer: { $in: customerIds } } },
      { $group: { _id: '$customer', count: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } }
    ]);

    const countMap = {};
    appointmentCounts.forEach(apt => {
      countMap[apt._id.toString()] = { count: apt.count, totalSpent: apt.totalSpent };
    });

    const enrichedCustomers = customers.map(customer => ({
      ...customer.toObject(),
      appointmentCount: countMap[customer._id.toString()]?.count || 0,
      totalSpent: countMap[customer._id.toString()]?.totalSpent || 0
    }));

    // Top customers by spending
    const topCustomers = enrichedCustomers
      .filter(c => c.totalSpent > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    res.json({
      totalCustomers: customers.length,
      customers: enrichedCustomers,
      topCustomers,
      summary: {
        newCustomers: customers.filter(c => {
          const created = new Date(c.createdAt);
          const now = new Date();
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return created >= thisMonth;
        }).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get top services report
const getTopServices = async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const services = await Appointment.aggregate([
      { $match: { ...dateFilter, status: 'completed' } },
      { $group: { _id: '$serviceType', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const totalCount = services.reduce((sum, s) => sum + s.count, 0);
    const totalRevenue = services.reduce((sum, s) => sum + s.revenue, 0);

    res.json({
      services: services.map(s => ({
        serviceType: s._id,
        count: s.count,
        revenue: s.revenue,
        percentage: totalCount > 0 ? (s.count / totalCount) * 100 : 0
      })),
      summary: {
        totalServices: totalCount,
        totalRevenue
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get daily stats
const getDailyStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const appointments = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('customer', 'name');

    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const pendingAppointments = appointments.filter(a => a.status === 'pending');
    const inProgressAppointments = appointments.filter(a => a.status === 'in-progress');

    const revenue = completedAppointments.reduce((sum, a) => sum + a.totalAmount, 0);

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      totalAppointments: appointments.length,
      completed: completedAppointments.length,
      pending: pendingAppointments.length,
      inProgress: inProgressAppointments.length,
      revenue,
      appointments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // This month's appointments
    const monthlyAppointments = await Appointment.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const completedAppointments = monthlyAppointments.filter(a => a.status === 'completed');
    const pendingAppointments = monthlyAppointments.filter(a => a.status === 'pending');

    // Revenue this month
    const revenue = completedAppointments
      .filter(a => a.paymentStatus === 'paid')
      .reduce((sum, a) => sum + a.totalAmount, 0);

    // Expenses this month
    const expenses = await Expense.find({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Total customers
    const totalCustomers = await Customer.countDocuments();

    // Today's appointments
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const todayAppointments = await Appointment.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({
      revenue,
      expenses: totalExpenses,
      profit: revenue - totalExpenses,
      totalAppointments: monthlyAppointments.length,
      completedAppointments: completedAppointments.length,
      pendingAppointments: pendingAppointments.length,
      todayAppointments: todayAppointments.length,
      totalCustomers,
      appointmentStatus: {
        pending: pendingAppointments.length,
        inProgress: monthlyAppointments.filter(a => a.status === 'in-progress').length,
        completed: completedAppointments.length,
        cancelled: monthlyAppointments.filter(a => a.status === 'cancelled').length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRevenueReport,
  getExpensesReport,
  getCustomerReport,
  getTopServices,
  getDailyStats,
  getDashboardSummary
};

