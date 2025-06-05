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

        // Calculate total transactions and net revenue
        const totalTransactions = reservations.length;
        const totalRevenue = reservations.reduce((sum, r) => {
            const deduction = (r.totalAmount * 0.12) + 1;
            const netAmount = Math.max(0, Number((r.totalAmount - deduction).toFixed(2)));
            return sum + netAmount;
        }, 0);

        const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
        const periodStart = `1 ${monthName}`;
        const periodEnd = `${new Date(year, month, 0).getDate()} ${monthName} ${year}`;

        // HTML email template
        const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border:1px solid #ccc; border-radius:8px; overflow:hidden;">
          <div style="background:#444; color:#fff; padding:10px 20px; font-size:18px; font-weight:bold;">Email Contents</div>
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
              <div>💰 <b>Total Revenue :</b> <span style="color:#EFCD00; font-weight:bold;">RM ${totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2})}</span></div>
            </div>
            <div style="margin-top:24px; color:#444;">Warm regards,<br><a href="https://resto.com" style="color:#0070f3; font-weight:bold; text-decoration:none;">Resto.com Team</a></div>
          </div>
        </div>
        `;

        // Group reservations by date
        const groupedReservations = reservations.reduce((groups, reservation) => {
            const date = new Date(reservation.date).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(reservation);
            return groups;
        }, {});

        // Sort dates
        const sortedDates = Object.keys(groupedReservations).sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        // Create PDF
        const doc = new jsPDF();
        
        const logoBase64 = 'data:image/png;base64,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';
        doc.addImage(logoBase64, 'PNG', 14, 10, 30, 30);
        
        // Add title
        doc.setFontSize(16);
        doc.text(`${restaurant.name} - Transaction Report`, 50, 25);
        doc.setFontSize(12);
        doc.text(`Month: ${monthName} ${year}`, 50, 35);
        
        let currentY = 45;
        let totalAmount = 0;

        // Add reservations by date
        sortedDates.forEach((date, dateIndex) => {
            const dateReservations = groupedReservations[date];
            
            // Add date header
            doc.setFontSize(12);
            doc.text(date, 14, currentY);
            currentY += 7;

            // Prepare table data (show net amount)
            const tableData = dateReservations.map((r, index) => {
                const deduction = (r.totalAmount * 0.12) + 1;
                const netAmount = Math.max(0, Number((r.totalAmount - deduction).toFixed(2)));
                return [
                    index + 1,
                    r.time,
                    `RM ${netAmount.toFixed(2)}`
                ];
            });

            // Add table
            autoTable(doc, {
                startY: currentY,
                head: [['No.', 'Time', 'Amount']],
                body: tableData,
                theme: 'grid',
                styles: { fontSize: 10 },
                headStyles: { fillColor: [239, 205, 0] } // #EFCD00 in RGB
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

        // Add total
        doc.setFontSize(12);
        doc.setTextColor(239, 205, 0); // #EFCD00 in RGB
        doc.text(`Total Amount: RM ${totalAmount.toFixed(2)}`, 14, currentY);

        // Generate PDF buffer
        const pdfBuffer = doc.output('arraybuffer');

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.Email_User,
                pass: process.env.Email_Pass
            }
        });

        // Send email
        await transporter.sendMail({
            from: process.env.Email_User,
            to: restaurant.email,
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