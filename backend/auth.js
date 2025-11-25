const bcrypt = require('bcryptjs');
const { 
  findUserByUsername, 
  updateUser, 
  createRememberToken, 
  validateRememberToken, 
  deleteRememberToken,
  deleteUserRememberTokens 
} = require('./database');

async function login(username, password, rememberMe = false) {
  try {
    const user = await findUserByUsername(username);
    
    if (!user) {
      return { success: false, message: 'Invalid username or password' };
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return { success: false, message: 'Invalid username or password' };
    }
    
    const response = {
      success: true,
      user: {
        id: user.id,
        username: user.username
      }
    };
    
    // Generate remember me token if requested
    if (rememberMe) {
      const token = await createRememberToken(user.id, user.username);
      response.rememberToken = token;
    }
    
    return response;
  } catch (error) {
    return { success: false, message: 'Login failed' };
  }
}

async function loginWithToken(token) {
  try {
    const tokenData = await validateRememberToken(token);
    
    if (!tokenData) {
      return { success: false, message: 'Invalid or expired token' };
    }
    
    const user = await findUserByUsername(tokenData.username);
    
    if (!user) {
      // User no longer exists, delete token
      await deleteRememberToken(token);
      return { success: false, message: 'User not found' };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username
      },
      rememberToken: token // Return the same token to keep it
    };
  } catch (error) {
    return { success: false, message: 'Token validation failed' };
  }
}

async function logout(token = null) {
  try {
    if (token) {
      await deleteRememberToken(token);
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: 'Logout failed' };
  }
}

async function verifyRecoveryPin(username, pin) {
  try {
    const user = await findUserByUsername(username);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    const isValidPin = await bcrypt.compare(pin, user.recoveryPin);
    
    if (!isValidPin) {
      return { success: false, message: 'Invalid recovery PIN' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: 'PIN verification failed' };
  }
}

async function resetPassword(username, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await updateUser(username, { password: hashedPassword });
    
    if (!updated) {
      return { success: false, message: 'User not found' };
    }
    
    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    return { success: false, message: 'Password reset failed' };
  }
}

async function changePassword(username, currentPassword, newPassword) {
  try {
    const user = await findUserByUsername(username);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await updateUser(username, { password: hashedPassword });
    
    return { success: true, message: 'Password changed successfully' };
  } catch (error) {
    return { success: false, message: 'Password change failed' };
  }
}

async function changeRecoveryPin(username, currentPassword, newPin) {
  try {
    const user = await findUserByUsername(username);
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }
    
    const hashedPin = await bcrypt.hash(newPin, 10);
    await updateUser(username, { recoveryPin: hashedPin });
    
    return { success: true, message: 'Recovery PIN changed successfully' };
  } catch (error) {
    return { success: false, message: 'PIN change failed' };
  }
}

module.exports = {
  login,
  loginWithToken,
  logout,
  verifyRecoveryPin,
  resetPassword,
  changePassword,
  changeRecoveryPin
};

