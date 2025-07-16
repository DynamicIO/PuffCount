# Puff Tracker 📱

A comprehensive React Native mobile application designed to help users monitor and track their daily puff consumption with detailed analytics, goal setting, and progress visualization.

## 🎯 Overview

Puff Tracker is a user-friendly mobile app that enables individuals to log their daily puff consumption, set personal goals, track progress over time, and gain insights into their usage patterns. The app features a clean, modern interface with both light and dark themes, comprehensive statistics, and achievement system to encourage healthy habits.

## ✨ Key Features

### 📊 Daily Tracking & Analytics
- **Real-time Puff Counter**: Easy-to-use increment/decrement buttons for logging puffs
- **Progress Circle**: Visual circular progress indicator showing daily consumption vs. goal
- **Smart Statistics Cards**:
  - **Daily Average**: Overall average across all recorded days
  - **Weekly Average**: Monday-Sunday weekly average for current week
  - **Monthly Average**: Daily average for the current month

### 📅 Calendar Integration
- **Interactive Calendar**: Visual calendar with color-coded dots indicating daily consumption levels
- **Dynamic Color System**: 
  - Blue/Green: At or below daily goal
  - Yellow: Above goal but below 1.5x goal
  - Red: Above 1.5x daily goal
- **Date Selection**: Tap any date to view/edit historical data
- **Daily Header**: Shows selected date with day name, month, and year

### 🎯 Goal Setting & Progress
- **Customizable Daily Goal**: Set and adjust personal daily consumption targets
- **Progress Bar**: Visual indicator showing current progress toward daily goal
- **Dynamic Thresholds**: Calendar colors automatically adjust based on your set goal
- **Cost Tracking**: Monitor daily spending based on cost per unit

### 📈 Monthly Reports
- **Detailed Monthly View**: Comprehensive breakdown of daily consumption for any month
- **Visual Bar Charts**: Each day shows consumption with color-coded bars
- **Monthly Totals**: Automatic calculation of total monthly consumption
- **Trend Analysis**: Easy identification of patterns and trends

### 🏆 Achievement System
- **Progress Milestones**: Unlock achievements for various accomplishments:
  - First Step: Log your first puff
  - Goal Crusher: Stay under daily goal
  - Building Habits: 3-day streak under goal
  - Week Warrior: 7-day streak under goal
  - Monthly Master: 30-day streak under goal
  - Money Saver: Save over $50
- **Achievement Notifications**: Real-time popups when unlocking new achievements
- **Achievement Gallery**: View all unlocked achievements in settings

### ⚙️ Settings & Customization
- **Goal Adjustment**: Easy increment/decrement buttons to modify daily targets
- **Cost Configuration**: Set cost per unit for financial tracking
- **Theme Toggle**: Switch between light and dark modes
- **Data Management**: Reset all data while preserving settings

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface with smooth animations
- **Dark/Light Themes**: Toggle between themes with persistent preference saving
- **Responsive Layout**: Optimized for various screen sizes
- **Smooth Animations**: Button press feedback and transition animations
- **Color-coded Elements**: Intuitive color system for quick status recognition

## 📱 Use Cases

### Personal Health Monitoring
- Track daily consumption patterns to identify trends
- Set reduction goals and monitor progress over time
- Visualize consumption data to make informed decisions
- Monitor spending related to consumption habits

### Habit Formation
- Use achievement system for motivation
- Set realistic daily goals and gradually reduce over time
- Build awareness of consumption patterns
- Create accountability through consistent logging

### Data Analysis
- Review monthly reports to identify high/low consumption periods
- Analyze weekly averages to understand weekly patterns
- Track long-term trends and progress
- Monitor financial impact of consumption habits

### Healthcare Support
- Provide accurate consumption data to healthcare providers
- Track progress during reduction programs
- Maintain detailed logs for medical consultations
- Monitor the effectiveness of interventions

## 🛠️ Technical Features

### Data Persistence
- **Local Storage**: All data stored locally using AsyncStorage
- **Automatic Saving**: Real-time data synchronization
- **Settings Persistence**: Theme and configuration preferences saved
- **Achievement Tracking**: Persistent achievement progress

### Performance Optimizations
- **Smooth Animations**: Optimized React Native animations
- **Efficient Rendering**: Minimal re-renders with proper state management
- **Calendar Performance**: Efficient date handling and marking
- **Scroll Optimization**: Smooth scrolling for monthly reports

### Platform Compatibility
- **Cross-platform**: Works on both iOS and Android
- **Safe Area Handling**: Proper handling of device-specific layouts
- **Status Bar**: Adaptive status bar for different themes
- **Platform-specific Styling**: Optimized for each platform

## 📊 Statistics & Insights

The app provides comprehensive analytics including:

- **Daily Metrics**: Current day consumption and goal progress
- **Weekly Trends**: Monday-Sunday weekly averages
- **Monthly Summaries**: Full month breakdowns with daily details
- **Historical Data**: Access to all previously recorded data
- **Financial Tracking**: Cost calculations and savings estimates
- **Streak Tracking**: Consecutive days meeting goals

## 🎮 Interactive Elements

### Touch Interactions
- **Add/Remove Buttons**: Large, accessible buttons for easy logging
- **Calendar Navigation**: Intuitive date selection
- **Settings Controls**: Easy-to-use increment/decrement controls
- **Modal Interactions**: Smooth modal presentations

### Visual Feedback
- **Button Animations**: Scale and fade effects on button presses
- **Progress Indicators**: Real-time visual progress updates
- **Color Transitions**: Smooth color changes based on status
- **Achievement Popups**: Celebratory notifications for milestones

## 💾 Data Management

### Storage Features
- **Automatic Backup**: Real-time saving of all user data
- **Data Integrity**: Robust error handling for data operations
- **Reset Functionality**: Option to clear all data while preserving settings
- **Migration Support**: Future-proof data structure

### Privacy & Security
- **Local Storage Only**: All data remains on the user's device
- **No External Servers**: Complete privacy and data control
- **No User Accounts**: No registration or personal information required
- **Offline Functionality**: Full app functionality without internet connection

## 🚀 Getting Started

### Installation Requirements
- React Native development environment
- iOS Simulator or Android Emulator
- Node.js and npm/yarn package manager

### Dependencies
- `react-native-calendars`: Interactive calendar component
- `@react-native-async-storage/async-storage`: Local data persistence
- `react-native`: Core React Native framework

### Setup Instructions
1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npx react-native start`
4. Run on iOS: `npx react-native run-ios`
5. Run on Android: `npx react-native run-android`

## 🎯 Future Enhancements

Potential future features could include:
- Export data to CSV/PDF formats
- Backup and restore functionality
- Additional chart types and visualizations
- Notification reminders
- Advanced goal setting (weekly/monthly goals)
- Integration with health apps
- Social features for accountability
- Advanced analytics and insights

## 📝 License

This project is available for personal use and modification. Please refer to the license file for detailed terms and conditions.

---

**Puff Tracker** - Empowering users to take control of their habits through comprehensive tracking, goal setting, and progress visualization. 🎯📊 