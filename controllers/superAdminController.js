import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { transporter } from "../utils/transpoter.js";
import SuperAdmin from "../models/SuperAdmin.js";
import Restaurant from "../models/Restaurant.js";
import Points from "../models/Points.js";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import admin from "../firebaseAdmin.js";
import Reservation from "../models/Reservations.js";
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
dotenv.config();



const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }  
  );
};

export const signUp = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);

  try {
    let user = await SuperAdmin.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'SuperAdmin already exists' });
    }

    const customer = new SuperAdmin({ email, password });
    await customer.save();

    return res.status(201).json({ msg: 'SuperAdmin created successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ msg: 'Logged out successfully' });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const customer = await SuperAdmin.findOne({ email });
    if (!customer) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

   
    const userId = customer._id

    return res.status(200).json({ msg: 'Login successful' , id: userId });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

export const addRestaurant = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let existingRestaurant = await Restaurant.findOne({ email });
    if (existingRestaurant) {
      return res.status(400).json({ msg: "email is already taken" });
    }

    const newRestaurant = new Restaurant({ name, email, password });

    await newRestaurant.save();

    return res
      .status(201)
      .json({
        msg: "Restaurant registered successfully",
        restaurant: newRestaurant,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const getRestaurantNames = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}, "name"); 
    return res.status(200).json({ restaurants });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const deleteRestaurant = async (req, res) => {
    const { id } = req.query;
    
  
    try {
      const restaurant = await Restaurant.findByIdAndDelete(id);
      
      if (!restaurant) {
        return res.status(404).json({ msg: "Restaurant not found" });
      }
      return res.status(200).json({ msg: "Restaurant deleted successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Server error" });
    }
  };

export const changeRestaurantPassword = async (req, res) => {
    const { id } = req.query;
    const { newPassword } = req.body;
  
    try {
      let restaurant = await Restaurant.findById(id);
      if (!restaurant) {
        return res.status(404).json({ msg: "Restaurant not found" });
      }
  
      restaurant.password = newPassword; 
      await restaurant.save();
  
      return res.status(200).json({ msg: "Password updated successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Server error" });
    }
};

export const pointsManagement = async (req, res) => {
  const { pointsPerTopup, pointEqualTo } = req.body;

  try {
    let points = await Points.findOne();

    if (points) {
      points.pointsPerTopup = pointsPerTopup;
      points.pointEqualTo = pointEqualTo;

      points = await points.save();
      return res.status(200).json({
        success: true,
        message: "Points updated successfully",
        points,
      });
    } else {
      points = new Points({
        pointsPerTopup,
        pointEqualTo,
      });

      await points.save();
      return res.status(201).json({
        success: true,
        message: "Points created successfully",
        points,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const sendNotification = async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    const customers = await Customer.find({}, "fcmToken");
    const tokens = customers.map((customer) => customer.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(404).json({ error: "No customers with FCM tokens found" });
    }

    const message = {
      notification: {
        title,
        body: content,
      },
    };

    // Initialize the Messaging instance
    const messaging = admin.messaging();

    // Firebase limits batch size to 500 tokens
    const batchSize = 500;
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batchTokens = tokens.slice(i, i + batchSize);

      const response = await messaging.sendEachForMulticast({
        tokens: batchTokens,
        ...message,
      });

      // Track successes and failures
      response.responses.forEach((resp, idx) => {
        if (resp.success) {
          successCount++;
        } else {
          failureCount++;
          invalidTokens.push(batchTokens[idx]);
        }
      });
    }

    // Optionally remove invalid tokens
    await Customer.updateMany(
      { fcmToken: { $in: invalidTokens } },
      { $unset: { fcmToken: 1 } }
    );

    return res.status(200).json({
      message: "Notifications sent successfully",
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error("Error sending notifications:", error);
    return res.status(500).json({ error: "Failed to send notifications" });
  }
};


export const getRestaurantReservations = async (req, res) => {
  try {
      const { restaurantId } = req.params;
      const { 
          page = 1, 
          limit = 10, 
          startDate, 
          endDate,
          month,
          year 
      } = req.query;

      // Build query object
      const query = { restaurant: restaurantId };

      // Add date filters if provided
      if (startDate && endDate) {
          query.date = {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
          };
      } else if (month && year) {
          // Filter by specific month and year
          const startOfMonth = new Date(year, month - 1, 1);
          const endOfMonth = new Date(year, month, 0);
          query.date = {
              $gte: startOfMonth,
              $lte: endOfMonth
          };
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get total count for pagination
      const totalReservations = await Reservation.countDocuments(query);

      let reservations = await Reservation.find(query)
          .populate('user', 'name email')
          .select('user totalAmount date time')
          .sort({ date: -1, time: -1 })
          .skip(skip)
          .limit(parseInt(limit));

      if (!reservations || reservations.length === 0) {
          return res.status(404).json({
              success: false,
              message: 'No reservations found for this restaurant'
          });
      }

      // Calculate net amount and replace totalAmount
      reservations = reservations.map(r => {
        const deduction = (r.totalAmount * 0.12) + 1;
        const netAmount = Math.max(0, Number((r.totalAmount - deduction).toFixed(2)));
        const reservationObj = r.toObject();
        reservationObj.totalAmount = netAmount;
        return reservationObj;
      });

      // Calculate pagination info
      const totalPages = Math.ceil(totalReservations / parseInt(limit));
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.status(200).json({
          success: true,
          data: reservations,
          pagination: {
              currentPage: parseInt(page),
              totalPages,
              totalReservations,
              hasNextPage,
              hasPrevPage,
              limit: parseInt(limit)
          }
      });

  } catch (error) {
      res.status(500).json({
          success: false,
          message: 'Error fetching reservations',
          error: error.message
      });
  }
};

// Send monthly report to restaurant
export const sendMonthlyReport = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { month, year } = req.query;

    // Get restaurant details
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Get reservations for the specified month
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const reservations = await Reservation.find({
      restaurant: restaurantId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    }).populate('user', 'name email')
      .sort({ date: 1, time: 1 });

    if (!reservations || reservations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No reservations found for this period'
      });
    }

    const totalTransactions = reservations.length;
    const totalRevenue = reservations.reduce((sum, r) => {
      const deduction = (r.totalAmount * 0.12) + 1;
      const netAmount = Math.max(0, Number((r.totalAmount - deduction).toFixed(2)));
      return sum + netAmount;
    }, 0);

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const periodStart = `1 ${monthName}`;
    const periodEnd = `${new Date(year, month, 0).getDate()} ${monthName} ${year}`;

    const logoUrl = 'https://res.cloudinary.com/dczuqcqqo/image/upload/v1749819397/Group_1_xk0mtu.png';

    // Email HTML with external logo URL
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border:1px solid #ccc; border-radius:8px; overflow:hidden;">
      <div style="background:#f4f4f4; padding:10px 20px; text-align: left;">
  <img src="${logoUrl}" alt="Logo" style="height: 30px; vertical-align: middle;">
</div>
      <div style="padding:24px 20px 10px 20px;">
        <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">Subject: 🧾 Monthly Transaction Statement – ${monthName} ${year}</div>
        <div style="margin-bottom:18px;">
          Hi <b>${restaurant.name}</b>,
        </div>
        <div style="margin-bottom:18px;">
          Attached is your monthly transaction summary for <b>${monthName} ${year}</b>, reflecting all purchases made by users this month.
        </div>
        <div style="margin-bottom:18px;">
          <div style="margin-bottom:6px;">📅 <b>Period:</b> ${periodStart} – ${periodEnd}</div>
          <div style="margin-bottom:6px;">🧾 <b>Total Transactions:</b> <b>${totalTransactions}</b></div>
          <div>💰 <b>Total Revenue :</b> <span style="color:#00FF00; font-weight:bold;">RM ${totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2})}</span></div>
        </div>
        <div style="margin-top:24px; color:#444;">Warm regards,<br><a href="https://resto.com" style="color:#0070f3; font-weight:bold; text-decoration:none;">Resto.com Team</a></div>
      </div>
    </div>
    `;

    // Group and sort reservations by date
    const groupedReservations = reservations.reduce((groups, reservation) => {
      const date = new Date(reservation.date).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(reservation);
      return groups;
    }, {});

    const sortedDates = Object.keys(groupedReservations).sort((a, b) => new Date(a) - new Date(b));

    // Fetch logo image from Cloudinary and convert to base64
    const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
    const logoBase64 = Buffer.from(logoResponse.data, 'binary').toString('base64');

    // Generate PDF
    const doc = new jsPDF();
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', 14, 10, 50, 18);
    doc.setFontSize(16);
    doc.text(`${restaurant.name} - Transaction Report`, 70, 30);
    doc.setFontSize(12);
    doc.text(`Month: ${monthName} ${year}`, 70, 40);

    let currentY = 50;
    let totalAmount = 0;

    sortedDates.forEach((date, dateIndex) => {
      const dateReservations = groupedReservations[date];
      doc.setFontSize(12);
      doc.text(date, 14, currentY);
      currentY += 7;

      const tableData = dateReservations.map((r, index) => {
        const deduction = (r.totalAmount * 0.12) + 1;
        const netAmount = Math.max(0, Number((r.totalAmount - deduction).toFixed(2)));
        return [
          index + 1,
          r.time,
          `RM ${netAmount.toFixed(2)}`
        ];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['No.', 'Time', 'Amount']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [239, 205, 0] }
      });

      currentY = doc.lastAutoTable.finalY + 10;
      totalAmount += dateReservations.reduce((sum, r) => {
        const deduction = (r.totalAmount * 0.12) + 1;
        const netAmount = Math.max(0, Number((r.totalAmount - deduction).toFixed(2)));
        return sum + netAmount;
      }, 0);

      if (dateIndex < sortedDates.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(14, currentY - 5, 196, currentY - 5);
        currentY += 5;
      }
    });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 128, 0);
    doc.text(`Total Amount: RM ${totalAmount.toFixed(2)}`, 14, currentY);

    const pdfBuffer = doc.output('arraybuffer');
    console.log(process.env.Email_Monthly);
    console.log(process.env.Email_Monthly_Pass);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.Email_Monthly,
        pass: process.env.Email_Monthly_Pass
      }
    });

    await transporter.sendMail({
      from: process.env.Email_Monthly,
      // to: restaurant.email,
      to: "hafiz@gmail.com",
      subject: `🧾 Monthly Transaction Statement – ${monthName} ${year}`,
      html,
      attachments: [{
        filename: `${restaurant.name}-transactions-${monthName}-${year}.pdf`,
        content: Buffer.from(pdfBuffer)
      }]
    });

    res.status(200).json({
      success: true,
      message: 'Report sent successfully to restaurant email'
    });

  } catch (error) {
    console.error('Error sending report:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending report',
      error: error.message
    });
  }
};
