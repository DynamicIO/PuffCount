import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar, Animated, Modal, Switch, Dimensions } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return `${month}-${day}-${year}`;
};

const getMonthName = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long' });
};

// Progress Circle Component
const ProgressCircle = ({ count, isDarkMode, dailyGoal }) => {
  const progress = Math.min(count / dailyGoal, 1);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - progress * circumference;
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressCircle}>
        <View style={[styles.progressBackground, { borderColor: isDarkMode ? '#333' : '#e0e0e0' }]} />
                 <View 
          style={[
            styles.progressForeground, 
            { 
              borderColor: count > dailyGoal ? '#ff6b6b' : '#4ecdc4',
              transform: [{ rotate: `${progress * 360}deg` }]
            }
          ]} 
        />
        <View style={styles.progressCenter}>
          <Text style={[styles.progressText, { color: isDarkMode ? '#fff' : '#333' }]}>
            {count}
          </Text>
          <Text style={[styles.progressSubText, { color: isDarkMode ? '#aaa' : '#666' }]}>
            puffs
          </Text>
        </View>
      </View>
    </View>
  );
};

export default function App() {
  const [puffData, setPuffData] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [puffCount, setPuffCount] = useState(0);
  const [buttonScale] = useState(new Animated.Value(1));
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
  const [monthlyPuffs, setMonthlyPuffs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [dailyGoal, setDailyGoal] = useState(10);
  const [costPerUnit, setCostPerUnit] = useState(0.50);
  const [achievements, setAchievements] = useState([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  
  // Loading screen states
  const [isLoading, setIsLoading] = useState(true);
  const [loadingFadeAnim] = useState(new Animated.Value(1));
  const [loadingScaleAnim] = useState(new Animated.Value(0.8));
  const [loadingRotateAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Start animations
    startLoadingAnimation();
    
    // Load all app data
    await Promise.all([
      loadPuffData(),
      loadThemePreference(),
      loadUserSettings(),
      loadAchievements()
    ]);
    
    // Minimum loading time for better UX (5 seconds)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Fade out loading screen
    Animated.parallel([
      Animated.timing(loadingFadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(loadingScaleAnim, {
        toValue: 1.2,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      setIsLoading(false);
    });
  };

  const startLoadingAnimation = () => {
    // Scale pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingScaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(loadingScaleAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(loadingRotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const loadUserSettings = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem('dailyGoal');
      const savedCost = await AsyncStorage.getItem('costPerUnit');
      if (savedGoal !== null) setDailyGoal(JSON.parse(savedGoal));
      if (savedCost !== null) setCostPerUnit(JSON.parse(savedCost));
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      const saved = await AsyncStorage.getItem('achievements');
      if (saved !== null) {
        setAchievements(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const saveUserSettings = async () => {
    try {
      await AsyncStorage.setItem('dailyGoal', JSON.stringify(dailyGoal));
      await AsyncStorage.setItem('costPerUnit', JSON.stringify(costPerUnit));
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  };

  const resetPuffData = async () => {
    try {
      // Clear puff data but keep settings
      await AsyncStorage.removeItem('puffData');
      await AsyncStorage.removeItem('achievements');
      
      // Reset state
      setPuffData({});
      setPuffCount(0);
      setAchievements([]);
      
      // Set today as selected date
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(today);
      
      // Close modal
      setGoalModalVisible(false);
    } catch (error) {
      console.error('Error resetting puff data:', error);
    }
  };

  const toggleDarkMode = async () => {
    const newThemeValue = !isDarkMode;
    setIsDarkMode(newThemeValue);
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newThemeValue));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const loadPuffData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('puffData');
      if (savedData) {
        const data = JSON.parse(savedData);
        setPuffData(data);
        
        // Set initial puff count for today if it exists
        const today = new Date().toISOString().split('T')[0];
        if (data[today]) {
          setPuffCount(data[today]);
          setSelectedDate(today);
        } else {
          setSelectedDate(today);
        }
      } else {
        // Set today as the initial selected date
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
      }
    } catch (error) {
      console.error('Error loading puff data:', error);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);
    setPuffCount(puffData[date.dateString] || 0);
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Add pulse effect
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const incrementPuff = async () => {
    animateButton();
    const newCount = puffCount + 1;
    setPuffCount(newCount);
    
    try {
      const updatedPuffData = { ...puffData, [selectedDate]: newCount };
      setPuffData(updatedPuffData);
      await AsyncStorage.setItem('puffData', JSON.stringify(updatedPuffData));
      await checkAndUnlockAchievements(newCount);
    } catch (error) {
      console.error('Error saving puff data:', error);
    }
  };

  const decrementPuff = async () => {
    if (puffCount > 0) {
      animateButton();
      const newCount = puffCount - 1;
      setPuffCount(newCount);
      
      try {
        const updatedPuffData = { ...puffData };
        if (newCount === 0) {
          delete updatedPuffData[selectedDate];
        } else {
          updatedPuffData[selectedDate] = newCount;
        }
        setPuffData(updatedPuffData);
        await AsyncStorage.setItem('puffData', JSON.stringify(updatedPuffData));
      } catch (error) {
        console.error('Error saving puff data:', error);
      }
    }
  };

  const getMarkedDates = () => {
    const marked = {};
    Object.keys(puffData).forEach(date => {
      const count = puffData[date];
      let dotColor = '#4ecdc4'; // blue/green
      if (count > dailyGoal * 1.5) dotColor = '#ff6b6b'; // red
      else if (count > dailyGoal) dotColor = '#ffa726'; // yellow
      
      marked[date] = {
        marked: true,
        dotColor: isDarkMode ? dotColor : dotColor,
        text: `${count} puffs`
      };
    });
    
    // Mark the selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: isDarkMode ? '#4ecdc4' : '#4ecdc4',
      };
    }
    
    return marked;
  };

  const showMonthlyPuffs = () => {
    // Extract month and year from selected date
    const [year, month] = selectedDate.split('-');
    const monthKey = `${year}-${month}`;
    setCurrentMonth(`${getMonthName(selectedDate)} ${year}`);
    
    // Filter puff data for the selected month
    const monthPuffs = Object.entries(puffData)
      .filter(([date]) => date.startsWith(monthKey))
      .map(([date, count]) => ({
        date: formatDate(date),
        count
      }))
      .sort((a, b) => {
        const [aMonth, aDay] = a.date.split('-');
        const [bMonth, bDay] = b.date.split('-');
        return parseInt(aDay) - parseInt(bDay);
      });
    
    setMonthlyPuffs(monthPuffs);
    setMonthlyModalVisible(true);
  };

  const calculateMonthlyTotal = () => {
    return monthlyPuffs.reduce((total, item) => total + item.count, 0);
  };

  const getDailyAverage = () => {
    const totalPuffs = Object.values(puffData).reduce((sum, count) => sum + count, 0);
    const totalDays = Object.keys(puffData).length;
    return totalDays > 0 ? (totalPuffs / totalDays).toFixed(1) : 0;
  };

  const getWeeklyAverage = () => {
    if (!selectedDate) return 0;
    
    // Get current date
    const [year, month, day] = selectedDate.split('-');
    const currentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Find Monday of the current week
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday = 0
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - daysFromMonday);
    
    // Find Sunday of the current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    let total = 0;
    let days = 0;
    
    Object.entries(puffData).forEach(([date, count]) => {
      const [y, m, d] = date.split('-');
      const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      if (dateObj >= monday && dateObj <= sunday) {
        total += count;
        days++;
      }
    });
    
    return days > 0 ? (total / days).toFixed(1) : 0;
  };

  const getMonthlyAverage = () => {
    if (!selectedDate) return 0;
    
    // Get the month and year from selected date
    const [year, month] = selectedDate.split('-');
    const monthKey = `${year}-${month}`;
    
    let total = 0;
    let days = 0;
    
    Object.entries(puffData).forEach(([date, count]) => {
      if (date.startsWith(monthKey)) {
        total += count;
        days++;
      }
    });
    
    return days > 0 ? (total / days).toFixed(1) : 0;
  };

  const getMonthlyTotal = () => {
    if (!selectedDate) return 0;
    
    // Get the month and year from selected date
    const [year, month] = selectedDate.split('-');
    const monthKey = `${year}-${month}`;
    
    let total = 0;
    Object.entries(puffData).forEach(([date, count]) => {
      if (date.startsWith(monthKey)) {
        total += count;
      }
    });
    
    return total;
  };

  const getCurrentStreak = () => {
    if (!selectedDate || Object.keys(puffData).length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (currentDate >= new Date('2020-01-01')) {
      const dateString = currentDate.toISOString().split('T')[0];
      const dayCount = puffData[dateString] || 0;
      
      if (dayCount <= dailyGoal) {
        streak++;
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  const getTotalCostSaved = () => {
    const totalPuffs = Object.values(puffData).reduce((sum, count) => sum + count, 0);
    const avgDailyPuffs = totalPuffs / Math.max(Object.keys(puffData).length, 1);
    const potentialPuffs = Object.keys(puffData).length * 20; // Assuming 20 was previous average
    const puffsSaved = Math.max(0, potentialPuffs - totalPuffs);
    return (puffsSaved * costPerUnit).toFixed(2);
  };

  const getDailyCostSpent = () => {
    return (puffCount * costPerUnit).toFixed(2);
  };

  const checkAndUnlockAchievements = async (newCount) => {
    const newAchievements = [...achievements];
    let achievementUnlocked = false;

    const achievementsList = [
      { id: 'first_log', title: 'First Step', description: 'Logged your first puff', icon: '🎯', condition: () => newCount >= 1 },
      { id: 'goal_met', title: 'Goal Crusher', description: 'Stayed under daily goal', icon: '🏆', condition: () => newCount <= dailyGoal },
      { id: 'streak_3', title: 'Building Habits', description: '3 day streak under goal', icon: '🔥', condition: () => getCurrentStreak() >= 3 },
      { id: 'streak_7', title: 'Week Warrior', description: '7 day streak under goal', icon: '⭐', condition: () => getCurrentStreak() >= 7 },
      { id: 'streak_30', title: 'Monthly Master', description: '30 day streak under goal', icon: '👑', condition: () => getCurrentStreak() >= 30 },
      { id: 'cost_saver', title: 'Money Saver', description: 'Saved over $50', icon: '💰', condition: () => parseFloat(getTotalCostSaved()) >= 50 },
    ];

    achievementsList.forEach(achievement => {
      if (!newAchievements.find(a => a.id === achievement.id) && achievement.condition()) {
        newAchievements.push({...achievement, unlockedAt: new Date().toISOString()});
        setNewAchievement(achievement);
        achievementUnlocked = true;
      }
    });

    if (achievementUnlocked) {
      setAchievements(newAchievements);
      await AsyncStorage.setItem('achievements', JSON.stringify(newAchievements));
      setShowAchievement(true);
      setTimeout(() => setShowAchievement(false), 3000);
    }
  };

  // Theme-based styles
  const themeStyles = {
    backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa',
    textColor: isDarkMode ? '#ffffff' : '#2c2c2c',
    secondaryTextColor: isDarkMode ? '#b0b0b0' : '#6c757d',
    cardBackground: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderColor: isDarkMode ? '#333' : '#e9ecef',
    accentColor: '#4ecdc4',
    gradientStart: isDarkMode ? '#1a1a1a' : '#ffffff',
    gradientEnd: isDarkMode ? '#2a2a2a' : '#f8f9fa',
    modalBackground: isDarkMode ? '#1a1a1a' : '#ffffff',
    shadowColor: isDarkMode ? '#000' : '#00000015',
  };

  const spin = loadingRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Show loading screen
  if (isLoading) {
    return (
      <Animated.View style={[styles.loadingContainer, { 
        backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa',
        opacity: loadingFadeAnim 
      }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#0a0a0a' : '#f8f9fa'} />
        <Animated.View style={[
          styles.loadingContent,
          { transform: [{ scale: loadingScaleAnim }] }
        ]}>
          {/* Animated Logo Circle */}
          <Animated.View style={[
            styles.loadingLogoCircle,
            { 
              borderColor: '#4ecdc4',
              transform: [{ rotate: spin }]
            }
          ]}>
            <View style={styles.loadingLogoInner}>
              <Text style={styles.loadingEmoji}>💨</Text>
            </View>
          </Animated.View>
          
          {/* App Title */}
          <Text style={[styles.loadingTitle, { color: '#4ecdc4' }]}>
            Puff Tracker
          </Text>
          
          {/* Subtitle */}
          <Text style={[styles.loadingSubtitle, { color: isDarkMode ? '#b0b0b0' : '#6c757d' }]}>
            Loading your data...
          </Text>
          
          {/* Loading Dots Animation */}
          <View style={styles.loadingDotsContainer}>
            <View style={[styles.loadingDot, { backgroundColor: '#4ecdc4' }]} />
            <View style={[styles.loadingDot, { backgroundColor: '#4ecdc4' }]} />
            <View style={[styles.loadingDot, { backgroundColor: '#4ecdc4' }]} />
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeStyles.backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={themeStyles.backgroundColor} />
      <ScrollView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]} showsVerticalScrollIndicator={false}>
        
        {/* Header with gradient background */}
        <View style={[styles.headerContainer, { backgroundColor: themeStyles.cardBackground }]}>
          <View style={styles.headerContent}>
            <View>
                             <Text style={[styles.title, { color: themeStyles.accentColor }]}>Puff Tracker</Text>
              <Text style={[styles.subtitle, { color: themeStyles.secondaryTextColor }]}>Monitor your daily usage</Text>
            </View>
            <View style={styles.themeToggleContainer}>
              <Text style={[styles.themeToggleText, { color: themeStyles.textColor }]}>
                {isDarkMode ? '🌙' : '☀️'}
              </Text>
              <Switch
                trackColor={{ false: '#e0e0e0', true: '#4ecdc4' }}
                thumbColor={isDarkMode ? '#ffffff' : '#ffffff'}
                ios_backgroundColor="#e0e0e0"
                onValueChange={toggleDarkMode}
                value={isDarkMode}
                style={styles.switch}
              />
            </View>
          </View>
        </View>

                 {/* Enhanced Stats Cards */}
         <View style={styles.statsContainer}>
           <View style={[styles.statCard, { backgroundColor: themeStyles.cardBackground }]}>
             <Text style={[styles.statNumber, { color: themeStyles.accentColor }]}>{getDailyAverage()}</Text>
             <Text style={[styles.statLabel, { color: themeStyles.secondaryTextColor }]}>Daily Avg</Text>
             <Text style={[styles.statSubLabel, { color: themeStyles.secondaryTextColor }]}>All Time</Text>
           </View>
           <View style={[styles.statCard, { backgroundColor: themeStyles.cardBackground }]}>
             <Text style={[styles.statNumber, { color: '#ffa726' }]}>{getWeeklyAverage()}</Text>
             <Text style={[styles.statLabel, { color: themeStyles.secondaryTextColor }]}>Weekly Avg</Text>
             <Text style={[styles.statSubLabel, { color: themeStyles.secondaryTextColor }]}>Mon-Sun</Text>
           </View>
           <View style={[styles.statCard, { backgroundColor: themeStyles.cardBackground }]}>
             <Text style={[styles.statNumber, { color: '#ff6b6b' }]}>{getMonthlyAverage()}</Text>
             <Text style={[styles.statLabel, { color: themeStyles.secondaryTextColor }]}>Monthly Avg</Text>
             <Text style={[styles.statSubLabel, { color: themeStyles.secondaryTextColor }]}>Per Day</Text>
           </View>
         </View>

         {/* Cost & Goal Info */}
         <View style={[styles.infoCard, { backgroundColor: themeStyles.cardBackground }]}>
           <View style={styles.infoRow}>
             <Text style={[styles.infoLabel, { color: themeStyles.textColor }]}>💰 Today's Cost: ${getDailyCostSpent()}</Text>
             <TouchableOpacity 
               style={[styles.settingsButton, { borderColor: themeStyles.accentColor }]}
               onPress={() => setGoalModalVisible(true)}
             >
               <Text style={[styles.settingsButtonText, { color: themeStyles.accentColor }]}>⚙️ Settings</Text>
             </TouchableOpacity>
           </View>
           <View style={styles.progressBarContainer}>
             <View style={[styles.progressBar, { backgroundColor: themeStyles.borderColor }]}>
               <View style={[styles.progressBarFill, { 
                 width: `${Math.min((puffCount / dailyGoal) * 100, 100)}%`,
                 backgroundColor: puffCount <= dailyGoal ? themeStyles.accentColor : '#ff6b6b'
               }]} />
             </View>
             <Text style={[styles.progressText, { color: themeStyles.secondaryTextColor }]}>
               {puffCount}/{dailyGoal} daily goal
             </Text>
           </View>
         </View>
        
                 {/* Calendar */}
         <View style={[styles.calendarCard, { backgroundColor: themeStyles.cardBackground }]}>
           <Calendar
             onDayPress={handleDateSelect}
             markedDates={getMarkedDates()}
             renderHeader={(date) => {
               // Use selectedDate if available, otherwise fall back to current month
               let dateToShow;
               if (selectedDate) {
                 // Parse the date correctly to avoid timezone issues
                 const [year, month, day] = selectedDate.split('-');
                 dateToShow = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
               } else {
                 dateToShow = new Date(date);
               }
               
               const dayName = dateToShow.toLocaleDateString('en-US', { weekday: 'long' });
               const monthName = dateToShow.toLocaleDateString('en-US', { month: 'long' });
               const dayNumber = dateToShow.getDate();
               const year = dateToShow.getFullYear();
               
               return (
                 <View style={styles.calendarHeader}>
                   <Text style={[styles.calendarHeaderText, { color: themeStyles.textColor }]}>
                     {dayName} {monthName} {dayNumber} {year}
                   </Text>
                 </View>
               );
             }}
             theme={{
               todayTextColor: themeStyles.accentColor,
               selectedDayBackgroundColor: themeStyles.accentColor,
               selectedDayTextColor: '#ffffff',
               textColor: themeStyles.textColor,
               textDisabledColor: themeStyles.secondaryTextColor,
               monthTextColor: themeStyles.textColor,
               arrowColor: themeStyles.accentColor,
               backgroundColor: 'transparent',
               calendarBackground: 'transparent',
               dayTextColor: themeStyles.textColor,
               textSectionTitleColor: themeStyles.secondaryTextColor,
             }}
           />
         </View>
        
        {/* Counter Section with Progress Circle */}
        <View style={[styles.counterCard, { backgroundColor: themeStyles.cardBackground }]}>
          <Text style={[styles.dateText, { color: themeStyles.textColor }]}>
            📅 {formatDate(selectedDate)}
          </Text>
          
                     <ProgressCircle count={puffCount} isDarkMode={isDarkMode} dailyGoal={dailyGoal} />
          
          <Animated.View style={{ transform: [{ scale: buttonScale }], opacity: fadeAnim }}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.addButton, { 
                  backgroundColor: themeStyles.accentColor,
                  shadowColor: themeStyles.shadowColor 
                }]} 
                onPress={incrementPuff}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonIcon}>➕</Text>
                <Text style={styles.buttonText}>Add Puff</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.removeButton, { 
                  backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
                  borderColor: puffCount > 0 ? '#ff6b6b' : themeStyles.borderColor,
                  shadowColor: themeStyles.shadowColor 
                }]} 
                onPress={decrementPuff}
                activeOpacity={0.8}
                disabled={puffCount === 0}
              >
                <Text style={[styles.buttonIcon, { color: puffCount > 0 ? '#ff6b6b' : themeStyles.secondaryTextColor }]}>➖</Text>
                <Text style={[styles.buttonText, { 
                  color: puffCount > 0 ? '#ff6b6b' : themeStyles.secondaryTextColor 
                }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          <TouchableOpacity 
            style={[styles.monthlyButton, { 
              backgroundColor: isDarkMode ? '#2a2a2a' : '#f8f9fa',
              borderColor: themeStyles.accentColor,
              shadowColor: themeStyles.shadowColor 
            }]} 
            onPress={showMonthlyPuffs}
            activeOpacity={0.8}
          >
            <Text style={styles.monthlyButtonIcon}>📊</Text>
            <Text style={[styles.monthlyButtonText, { color: themeStyles.accentColor }]}>
              View Monthly Report
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Enhanced Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={monthlyModalVisible}
        onRequestClose={() => setMonthlyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeStyles.modalBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeStyles.accentColor }]}>
                📊 {currentMonth} Report
              </Text>
              <TouchableOpacity 
                style={styles.closeIcon}
                onPress={() => setMonthlyModalVisible(false)}
              >
                <Text style={[styles.closeIconText, { color: themeStyles.secondaryTextColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.monthlyList} showsVerticalScrollIndicator={false}>
              {monthlyPuffs.length > 0 ? (
                monthlyPuffs.map((item, index) => (
                  <View key={index} style={[styles.monthlyItem, { 
                    borderBottomColor: themeStyles.borderColor,
                    backgroundColor: index % 2 === 0 ? 'transparent' : (isDarkMode ? '#0f0f0f' : '#f8f9fa')
                  }]}>
                    <Text style={[styles.monthlyDate, { color: themeStyles.textColor }]}>{item.date}</Text>
                    <View style={styles.monthlyCountContainer}>
                      <Text style={[styles.monthlyCount, { 
                        color: item.count > 15 ? '#ff6b6b' : item.count > 10 ? '#ffa726' : themeStyles.accentColor 
                      }]}>
                        {item.count} puffs
                      </Text>
                      <View style={[styles.countBar, { backgroundColor: themeStyles.borderColor }]}>
                        <View style={[styles.countBarFill, { 
                          width: `${Math.min((item.count / 20) * 100, 100)}%`,
                          backgroundColor: item.count > 15 ? '#ff6b6b' : item.count > 10 ? '#ffa726' : themeStyles.accentColor
                        }]} />
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataEmoji}>📭</Text>
                  <Text style={[styles.noDataText, { color: themeStyles.secondaryTextColor }]}>
                    No puffs recorded for this month
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View style={[styles.monthlyTotal, { 
              borderTopColor: themeStyles.borderColor,
              backgroundColor: isDarkMode ? '#0f0f0f' : '#f8f9fa'
            }]}>
              <Text style={[styles.totalLabel, { color: themeStyles.textColor }]}>Monthly Total:</Text>
              <Text style={[styles.totalCount, { color: themeStyles.accentColor }]}>{calculateMonthlyTotal()} puffs</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={goalModalVisible}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeStyles.modalBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeStyles.accentColor }]}>⚙️ Settings</Text>
              <TouchableOpacity onPress={() => setGoalModalVisible(false)}>
                <Text style={[styles.closeIconText, { color: themeStyles.secondaryTextColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: themeStyles.textColor }]}>Daily Goal</Text>
              <View style={styles.goalInputContainer}>
                <TouchableOpacity 
                  style={[styles.goalButton, { backgroundColor: themeStyles.accentColor }]}
                  onPress={() => setDailyGoal(Math.max(1, dailyGoal - 1))}
                >
                  <Text style={styles.goalButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.goalValue, { color: themeStyles.textColor }]}>{dailyGoal}</Text>
                <TouchableOpacity 
                  style={[styles.goalButton, { backgroundColor: themeStyles.accentColor }]}
                  onPress={() => setDailyGoal(dailyGoal + 1)}
                >
                  <Text style={styles.goalButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={[styles.settingLabel, { color: themeStyles.textColor }]}>Cost Per Unit ($)</Text>
              <View style={styles.goalInputContainer}>
                <TouchableOpacity 
                  style={[styles.goalButton, { backgroundColor: themeStyles.accentColor }]}
                  onPress={() => setCostPerUnit(Math.max(0.01, costPerUnit - 0.01))}
                >
                  <Text style={styles.goalButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.goalValue, { color: themeStyles.textColor }]}>${costPerUnit.toFixed(2)}</Text>
                <TouchableOpacity 
                  style={[styles.goalButton, { backgroundColor: themeStyles.accentColor }]}
                  onPress={() => setCostPerUnit(costPerUnit + 0.01)}
                >
                  <Text style={styles.goalButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, { backgroundColor: themeStyles.accentColor }]}
              onPress={() => {
                saveUserSettings();
                setGoalModalVisible(false);
              }}
            >
              <Text style={styles.saveButtonText}>💾 Save Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.resetButton, { 
                backgroundColor: 'transparent',
                borderColor: '#ff6b6b',
                borderWidth: 2
              }]}
              onPress={resetPuffData}
            >
              <Text style={[styles.resetButtonText, { color: '#ff6b6b' }]}>🗑️ Reset All Data</Text>
            </TouchableOpacity>

            {/* Achievements Section */}
            <View style={styles.achievementsSection}>
              <Text style={[styles.achievementsTitle, { color: themeStyles.textColor }]}>🏆 Achievements ({achievements.length})</Text>
              <ScrollView style={styles.achievementsList} showsVerticalScrollIndicator={false}>
                {achievements.map((achievement, index) => (
                  <View key={index} style={[styles.achievementItem, { backgroundColor: isDarkMode ? '#0f0f0f' : '#f8f9fa' }]}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                    <View style={styles.achievementText}>
                      <Text style={[styles.achievementTitle, { color: themeStyles.textColor }]}>{achievement.title}</Text>
                      <Text style={[styles.achievementDesc, { color: themeStyles.secondaryTextColor }]}>{achievement.description}</Text>
                    </View>
                  </View>
                ))}
                {achievements.length === 0 && (
                  <Text style={[styles.noAchievements, { color: themeStyles.secondaryTextColor }]}>
                    🎯 Start tracking to unlock achievements!
                  </Text>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* Achievement Notification */}
      {showAchievement && newAchievement && (
        <Animated.View style={[styles.achievementNotification, { 
          backgroundColor: themeStyles.cardBackground,
          borderColor: themeStyles.accentColor 
        }]}>
          <Text style={styles.achievementNotificationIcon}>{newAchievement.icon}</Text>
          <View style={styles.achievementNotificationText}>
            <Text style={[styles.achievementNotificationTitle, { color: themeStyles.accentColor }]}>
              Achievement Unlocked!
            </Text>
            <Text style={[styles.achievementNotificationDesc, { color: themeStyles.textColor }]}>
              {newAchievement.title}
            </Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 47 : StatusBar.currentHeight,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 16,
    marginRight: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginHorizontal: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
  statSubLabel: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 2,
  },
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  settingsButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  calendarCard: {
    marginBottom: 20,
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  counterCard: {
    padding: 25,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  dateText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
    width: '100%',
  },
  addButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginHorizontal: 5,
  },
  removeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 2,
    marginHorizontal: 5,
  },
  buttonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  monthlyButton: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 2,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  monthlyButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  monthlyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeIcon: {
    padding: 5,
  },
  closeIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  monthlyList: {
    width: '100%',
    maxHeight: 300,
  },
  monthlyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  monthlyDate: {
    fontSize: 16,
  },
  monthlyCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthlyCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  countBar: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    backgroundColor: '#e0e0e0',
  },
  countBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  monthlyTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  noDataContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noDataEmoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBackground: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
  },
  progressForeground: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  progressSubText: {
    fontSize: 14,
    opacity: 0.7,
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  calendarHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingItem: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  goalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  goalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 60,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  achievementsSection: {
    maxHeight: 200,
  },
  achievementsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  achievementsList: {
    maxHeight: 150,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  achievementDesc: {
    fontSize: 12,
    opacity: 0.8,
  },
  noAchievements: {
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
    padding: 20,
  },
  achievementNotification: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  achievementNotificationIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  achievementNotificationText: {
    flex: 1,
  },
  achievementNotificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementNotificationDesc: {
    fontSize: 14,
    opacity: 0.9,
  },
  // Loading Screen Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 47 : StatusBar.currentHeight,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#4ecdc4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  loadingLogoInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1,
  },
  loadingSubtitle: {
    fontSize: 16,
    marginBottom: 30,
    opacity: 0.8,
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.6,
  },
});
