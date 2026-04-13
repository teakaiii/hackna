# ConcernTracker PRO - Professional Student Concern Management System

## 🚀 Deployment

### Online Deployment (InfinityFree)

For deployment to https://dash.infinityfree.com/accounts/if0_41647799:

1. **Get InfinityFree Credentials**
   - Login to your InfinityFree dashboard
   - Get MySQL database credentials
   - Get FTP credentials

2. **Upload Files**
   - Upload all files via FTP to `htdocs/` directory
   - Run `npm install --production` on server

3. **Configure Environment**
   - Create `.env` file with production settings (see `env.example`)
   - Update MySQL credentials from InfinityFree
   - Set Gmail App Password for email notifications

4. **Start Application**
   - Access SSH and run `npm start`
   - Or use PM2: `pm2 start server-enhanced.js --name concerntracker`

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🚀 Quick Start

### For Students
1. **Register**: Create your student account with your email and student ID
2. **Login**: Use your credentials to access the system
3. **Submit Concerns**: Fill out the form with category, description, and attachments
4. **Track Progress**: Monitor your concern status in real-time
5. **Edit Concerns**: Modify submitted concerns if needed

### For Admins
1. **Login**: Use admin credentials to access the dashboard
2. **Review Concerns**: View and manage submitted concerns
3. **Update Status**: Track concerns through the workflow
4. **Generate Reports**: Export data for analysis

### Demo Credentials
- **Student**: student@demo.com / password123
- **Admin**: admin@demo.com / admin123

> **Note**: For demo purposes, use the demo credentials. In production, students should register with their actual email and student ID.
- 🔐 **Role-based Authentication** (Student/Admin)
- 📱 **Responsive Design** (Mobile & Desktop)
- ⚡ **Real-time Updates** (Live status tracking)
- 🎨 **Modern UI** (Bootstrap 5 + Custom CSS)
- 📊 **Analytics Dashboard** (Statistics & Reports)

## 🛠 Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with gradients and animations
- **JavaScript (ES6+)** - Dynamic functionality
- **Bootstrap 5** - Responsive UI framework
- **Font Awesome** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **In-memory Storage** - Demo data (Firebase ready)

### Development Tools
- **Nodemon** - Auto-restart during development
- **Live Server** - Local development

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Quick Start

1. **Clone/Download the project**
   ```bash
   # If using git (not applicable for this setup)
   cd byahengapat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   # or for development with auto-restart
   npm run dev
   ```

4. **Open the application**
   - Navigate to: http://localhost:3000
   - Server will start automatically on port 3000

## 👤 Demo Credentials

### Student Account
- **Email**: student@demo.com
- **Password**: password123

### Admin Account
- **Email**: admin@demo.com
- **Password**: admin123

## 📁 Project Structure

```
hackaton-main/
├── server-enhanced.js        # Main app server (npm start)
├── server.js                 # Optional legacy server (npm run legacy)
├── ai-service.js / email-service.js
├── package.json
├── README.md
└── public/
    ├── track-concern.html    # Status page for tracking IDs
    ├── submit-concern-enhanced.html
    ├── admin-dashboard-enhanced.html
    ├── login.html              # also the home page (/)
    ├── student-dashboard.html / submit-concern.html / my-concerns.html
    ├── edit-concern.html / concern-details.html / register.html
    └── css/ / js/
```

## 🎯 User Guide

### For Students

1. **Login** with your student credentials
2. **Submit Concern**:
   - Choose category (Academic, Facilities, IT, Administrative)
   - Enter title and detailed description
   - Set priority level (Low, Medium, High)
   - Attach supporting documents (optional)
3. **Edit Concerns**: 
   - Click the edit button on submitted concerns
   - Modify title, description, category, or priority
   - Only available for concerns with "Submitted" status
4. **Track Progress**:
   - View dashboard with statistics
   - Check status of all concerns
   - View detailed timeline and comments

### For Administrators

1. **Login** with admin credentials
2. **Dashboard Overview**:
   - View total concerns and statistics
   - Monitor pending and in-progress items
3. **Manage Concerns**:
   - Filter by status, category, or priority
   - Update concern status with comments
   - View detailed concern information
4. **Reports**:
   - Export data to CSV
   - View analytics and trends

## 🔧 API Endpoints

### Authentication
- `POST /api/login` - User authentication

### Concerns
- `GET /api/concerns` - Get all concerns (with optional filters)
- `GET /api/concerns/:id` - Get specific concern details
- `POST /api/concerns` - Submit new concern
- `PUT /api/concerns/:id` - Update existing concern details
- `PUT /api/concerns/:id/status` - Update concern status

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🚀 Deployment Options

### Local Development
```bash
npm start
```

### Production Deployment
1. **Heroku**:
   ```bash
   # Install Heroku CLI
   heroku create your-app-name
   git push heroku main
   ```

2. **Vercel** (Frontend only):
   - Connect GitHub repository
   - Automatic deployment on push

3. **AWS/Azure/GCP**:
   - Deploy Node.js application
   - Configure environment variables

## 🔒 Security Features

- **Role-based Access Control**
- **Session Management**
- **Input Validation**
- **XSS Protection**
- **CSRF Protection** (ready for implementation)

## 📊 Database Schema (Ready for Firebase)

### Users Collection
```javascript
{
  id: string,
  email: string,
  password: string, // hashed
  name: string,
  role: 'student' | 'admin',
  studentId?: string,
  createdAt: timestamp
}
```

### Concerns Collection
```javascript
{
  id: string,
  studentId: string,
  title: string,
  description: string,
  category: string,
  priority: 'low' | 'medium' | 'high',
  status: 'submitted' | 'under_review' | 'in_progress' | 'resolved' | 'closed',
  createdAt: timestamp,
  updatedAt: timestamp,
  resolvedAt?: timestamp
}
```

## 🎨 UI/UX Features

- **Responsive Design**: Works on all devices
- **Modern Gradients**: Professional color schemes
- **Smooth Animations**: Hover effects and transitions
- **Loading States**: User feedback during operations
- **Error Handling**: Clear error messages
- **Accessibility**: Semantic HTML and ARIA labels
- **Edit Functionality**: Students can modify submitted concerns
- **Status Validation**: Only editable concerns show edit button

## 🔄 Future Enhancements

- **Firebase Integration**: Real database and authentication
- **Email Notifications**: Automated email alerts
- **File Uploads**: Document and image attachments
- **Advanced Analytics**: Charts and graphs
- **Mobile App**: React Native or Flutter app
- **API Integration**: Connect with existing university systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

For questions or support:
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ for hackathon demonstration**
