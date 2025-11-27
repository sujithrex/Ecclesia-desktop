# Ecclesia Desktop

<div align="center">

![Ecclesia Desktop](icon.png)

**A Modern Church Management System for CSI Churches**

[![Version](https://img.shields.io/github/v/release/sujithrex/Ecclesia-desktop)](https://github.com/sujithrex/Ecclesia-desktop/releases)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/sujithrex/Ecclesia-desktop/releases)

[Download](https://github.com/sujithrex/Ecclesia-desktop/releases/latest) • [Report Bug](https://github.com/sujithrex/Ecclesia-desktop/issues) • [Request Feature](https://github.com/sujithrex/Ecclesia-desktop/issues)

</div>

---

## 📖 About

Ecclesia Desktop is a comprehensive church management system designed specifically for CSI (Church of South India) churches in Tirunelveli and beyond. Built with modern technologies, it provides an intuitive interface for managing church records, certificates, and congregation data.

### ✨ Key Features

- **📜 Certificate Management**
  - Infant Baptism Certificates
  - Adult Baptism Certificates
  - Marriage Certificates & Bans
  - Burial Register
  - Custom Letterheads

- **👥 Congregation Management**
  - Family & Member Records
  - Area-wise Organization
  - Birthday & Wedding Anniversary Lists
  - Sabai Jabitha Reports

- **🏛️ Multi-Church Support**
  - Manage multiple churches from one application
  - Church-specific records and certificates
  - Centralized data management

- **📄 PDF Generation**
  - Professional certificate templates
  - Automated report generation
  - Print-ready documents

- **💾 Data Management**
  - Secure local database
  - Backup & Restore functionality
  - CSV export capabilities

- **🔐 Security**
  - Password-protected access
  - Recovery PIN system
  - User authentication

- **🔄 Auto-Updates**
  - Automatic update notifications
  - Seamless update installation
  - Always stay current

## 🚀 Download & Installation

### Windows

1. Download `Ecclesia-Desktop-Setup-1.0.5.exe` from the [latest release](https://github.com/sujithrex/Ecclesia-desktop/releases/latest)
2. Run the installer
3. Follow the installation wizard
4. Launch Ecclesia Desktop from your Start Menu

> **Note**: Windows 10 64-bit or later is required.

### macOS
1. Download `Ecclesia-Desktop-1.0.5-darwin-x64.zip` from the [latest release](https://github.com/sujithrex/Ecclesia-desktop/releases/latest)
2. Extract the ZIP file
3. Move Ecclesia Desktop to your Applications folder
4. Launch the application

### Linux

**Debian/Ubuntu (.deb)**
```bash
wget https://github.com/sujithrex/Ecclesia-desktop/releases/download/v1.0.5/ecclesia-desktop_.deb
sudo dpkg -i ecclesia-desktop_.deb
```

**Fedora/RHEL (.rpm)**
```bash
wget https://github.com/sujithrex/Ecclesia-desktop/releases/download/v1.0.5/ecclesia-desktop-1.0.5-1.x86_64.rpm
sudo rpm -i ecclesia-desktop-1.0.5-1.x86_64.rpm
```

## 💻 System Requirements

- **Windows**: Windows 10 64-bit or later
- **macOS**: macOS 10.13 (High Sierra) or later
- **Linux**: Ubuntu 18.04+, Fedora 32+, or equivalent
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space

## 🛠️ Development

### Prerequisites

- Node.js 20.x or later
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/sujithrex/Ecclesia-desktop.git
cd Ecclesia-desktop

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Run in development mode
npm run dev
```

### Build

```bash
# Build frontend
npm run build

# Package the application
npm run package

# Create distributable installers
npm run make
```

### Tech Stack

- **Frontend**: React 19, React Router, Vite
- **Backend**: Electron 39, Node.js
- **Database**: LowDB (JSON-based)
- **PDF Generation**: Puppeteer, EJS templates
- **UI Components**: Phosphor Icons, React Hot Toast, DataTables
- **Rich Text Editor**: TinyMCE

## 📝 Usage

### Default Login Credentials

On first launch, use these default credentials:

- **Username**: `admin`
- **Password**: `admin123`
- **Recovery PIN**: `1221`

> ⚠️ **Important**: Change these default credentials immediately after first login for security!

### Getting Started

1. **First Launch**: Login with default credentials (see above)
2. **Change Password**: Go to Settings → Profile and update your password and recovery PIN
3. **Add Church**: Set up your church details including name, address, and contact information
4. **Create Areas**: Organize your congregation by geographical areas
5. **Add Families**: Register families within each area
6. **Add Members**: Add individual members to families with complete details
7. **Generate Certificates**: Create and print baptism, marriage, and other certificates
8. **Reports**: Generate birthday lists, wedding anniversary lists, and other reports

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Authors

**Mr. Sujith & Mrs. Remina Sujith**

## 🙏 Acknowledgments

- Designed for CSI Churches in Tirunelveli Diocese
- Built with love for church administration and management

## 📞 Support

If you encounter any issues or have questions:

- 🐛 [Report a Bug](https://github.com/sujithrex/Ecclesia-desktop/issues)
- 💡 [Request a Feature](https://github.com/sujithrex/Ecclesia-desktop/issues)
- 📧 Contact the developers through GitHub

---

<div align="center">

Made with ❤️ for the Church

**[⬆ back to top](#ecclesia-desktop)**

</div>
