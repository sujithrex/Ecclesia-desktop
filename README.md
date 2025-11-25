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

**For 64-bit Windows (Recommended)**
1. Download `Ecclesia-Desktop-Setup-1.0.4.exe` (x64) from the [latest release](https://github.com/sujithrex/Ecclesia-desktop/releases/latest)
2. Run the installer
3. Follow the installation wizard
4. Launch Ecclesia Desktop from your Start Menu

**For 32-bit Windows**
1. Download `Ecclesia-Desktop-Setup-1.0.4-ia32.exe` from the [latest release](https://github.com/sujithrex/Ecclesia-desktop/releases/latest)
2. Run the installer
3. Follow the installation wizard
4. Launch Ecclesia Desktop from your Start Menu

> **Note**: Not sure which version? Right-click "This PC" → Properties. If it says "64-bit", use the 64-bit version.

### macOS
1. Download `Ecclesia-Desktop-1.0.4-darwin-x64.zip` from the [latest release](https://github.com/sujithrex/Ecclesia-desktop/releases/latest)
2. Extract the ZIP file
3. Move Ecclesia Desktop to your Applications folder
4. Launch the application

### Linux

**Debian/Ubuntu (.deb)**
```bash
wget https://github.com/sujithrex/Ecclesia-desktop/releases/download/v1.0.4/ecclesia-desktop_.deb
sudo dpkg -i ecclesia-desktop_.deb
```

**Fedora/RHEL (.rpm)**
```bash
wget https://github.com/sujithrex/Ecclesia-desktop/releases/download/v1.0.4/ecclesia-desktop-1.0.4-1.x86_64.rpm
sudo rpm -i ecclesia-desktop-1.0.4-1.x86_64.rpm
```

## 💻 System Requirements

- **Windows**: Windows 10 or later (both 32-bit and 64-bit supported)
- **macOS**: macOS 10.13 (High Sierra) or later (64-bit only)
- **Linux**: Ubuntu 18.04+, Fedora 32+, or equivalent (64-bit only)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space

> **Note**: Windows 7/8 are not officially supported by Electron 39, but may work on Windows 10/11 32-bit systems.

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

1. **First Launch**: Create your admin account with a secure password and recovery PIN
2. **Add Church**: Set up your church details including name, address, and contact information
3. **Create Areas**: Organize your congregation by geographical areas
4. **Add Families**: Register families within each area
5. **Add Members**: Add individual members to families with complete details
6. **Generate Certificates**: Create and print baptism, marriage, and other certificates
7. **Reports**: Generate birthday lists, wedding anniversary lists, and other reports

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
