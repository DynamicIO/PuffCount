import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar, Animated, Modal, Switch, Dimensions, Linking } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

// Skeleton Loading Component
const SkeletonLoader = ({ isDarkMode }) => {
  const [fadeAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const skeletonColor = isDarkMode ? '#2a2a2a' : '#e0e0e0';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView style={{ flex: 1, backgroundColor: isDarkMode ? '#0a0a0a' : '#f8f9fa' }}>
        {/* Header Skeleton */}
        <View style={{ padding: 20 }}>
          <Animated.View style={[styles.skeletonBox, { opacity: fadeAnim, backgroundColor: skeletonColor, height: 30, width: 150, marginBottom: 10 }]} />
          <Animated.View style={[styles.skeletonBox, { opacity: fadeAnim, backgroundColor: skeletonColor, height: 20, width: 200 }]} />
        </View>

        {/* Stats Cards Skeleton */}
        <View style={styles.statsContainer}>
          {[1, 2, 3].map((i) => (
            <Animated.View key={i} style={[styles.statCard, { opacity: fadeAnim, backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
              <View style={[styles.skeletonBox, { backgroundColor: skeletonColor, height: 24, width: '60%', marginBottom: 5, alignSelf: 'center' }]} />
              <View style={[styles.skeletonBox, { backgroundColor: skeletonColor, height: 12, width: '80%', marginTop: 5, alignSelf: 'center' }]} />
            </Animated.View>
          ))}
        </View>

        {/* Calendar Skeleton */}
        <Animated.View style={[styles.calendarCard, { opacity: fadeAnim, backgroundColor: isDarkMode ? '#1a1a1a' : '#fff', height: 350 }]}>
          <View style={[styles.skeletonBox, { backgroundColor: skeletonColor, height: 20, width: '60%', marginBottom: 20, alignSelf: 'center' }]} />
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 }}>
              {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                <View key={j} style={[styles.skeletonBox, { backgroundColor: skeletonColor, height: 30, width: 30, borderRadius: 15 }]} />
              ))}
            </View>
          ))}
        </Animated.View>

        {/* Counter Card Skeleton */}
        <Animated.View style={[styles.counterCard, { opacity: fadeAnim, backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' }]}>
          <View style={[styles.skeletonBox, { backgroundColor: skeletonColor, height: 140, width: 140, borderRadius: 70, alignSelf: 'center', marginBottom: 20 }]} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[styles.skeletonBox, { backgroundColor: skeletonColor, height: 50, flex: 1, borderRadius: 12 }]} />
            <View style={[styles.skeletonBox, { backgroundColor: skeletonColor, height: 50, flex: 1, borderRadius: 12 }]} />
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  const [puffTimestamps, setPuffTimestamps] = useState({}); // New: track timestamps for each puff
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
  const [chartsModalVisible, setChartsModalVisible] = useState(false);
  const [timeOfDayModalVisible, setTimeOfDayModalVisible] = useState(false);
  
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
      const savedTimestamps = await AsyncStorage.getItem('puffTimestamps');
      
      if (savedData) {
        const data = JSON.parse(savedData);
        setPuffData(data);
        
        // Load timestamps
        if (savedTimestamps) {
          setPuffTimestamps(JSON.parse(savedTimestamps));
        }
        
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

  const handleDateSelect = async (date) => {
    // Haptic feedback on date selection
    await Haptics.selectionAsync();
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
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateButton();
    const newCount = puffCount + 1;
    setPuffCount(newCount);
    
    try {
      const updatedPuffData = { ...puffData, [selectedDate]: newCount };
      setPuffData(updatedPuffData);
      
      // Save timestamp for time-of-day tracking
      const currentTime = new Date().toISOString();
      const updatedTimestamps = { ...puffTimestamps };
      if (!updatedTimestamps[selectedDate]) {
        updatedTimestamps[selectedDate] = [];
      }
      updatedTimestamps[selectedDate].push(currentTime);
      setPuffTimestamps(updatedTimestamps);
      
      await AsyncStorage.setItem('puffData', JSON.stringify(updatedPuffData));
      await AsyncStorage.setItem('puffTimestamps', JSON.stringify(updatedTimestamps));
      await checkAndUnlockAchievements(newCount);
    } catch (error) {
      console.error('Error saving puff data:', error);
    }
  };

  const decrementPuff = async () => {
    if (puffCount > 0) {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        
        // Remove last timestamp
        const updatedTimestamps = { ...puffTimestamps };
        if (updatedTimestamps[selectedDate] && updatedTimestamps[selectedDate].length > 0) {
          updatedTimestamps[selectedDate].pop();
          if (updatedTimestamps[selectedDate].length === 0) {
            delete updatedTimestamps[selectedDate];
          }
          setPuffTimestamps(updatedTimestamps);
          await AsyncStorage.setItem('puffTimestamps', JSON.stringify(updatedTimestamps));
        }
        
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
      
      // Heatmap-style color intensity based on count
      let dotColor = '#4ecdc4';
      let backgroundColor = 'transparent';
      
      if (count <= dailyGoal * 0.5) {
        // Very low - light green
        dotColor = '#4ecdc4';
        backgroundColor = isDarkMode ? 'rgba(78, 205, 196, 0.1)' : 'rgba(78, 205, 196, 0.15)';
      } else if (count <= dailyGoal) {
        // Low - green
        dotColor = '#4ecdc4';
        backgroundColor = isDarkMode ? 'rgba(78, 205, 196, 0.3)' : 'rgba(78, 205, 196, 0.35)';
      } else if (count <= dailyGoal * 1.5) {
        // Medium - orange
        dotColor = '#ffa726';
        backgroundColor = isDarkMode ? 'rgba(255, 167, 38, 0.3)' : 'rgba(255, 167, 38, 0.35)';
      } else {
        // High - red
        dotColor = '#ff6b6b';
        backgroundColor = isDarkMode ? 'rgba(255, 107, 107, 0.3)' : 'rgba(255, 107, 107, 0.35)';
      }
      
      marked[date] = {
        marked: true,
        dotColor,
        customStyles: {
          container: {
            backgroundColor,
            borderRadius: 16,
          },
        },
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

  const openDynamicIO = () => {
    Linking.openURL('https://dynamicio.vercel.app/');
  };

  // Get data for weekly chart
  const getWeeklyChartData = () => {
    if (!selectedDate) return { labels: [], datasets: [{ data: [0] }] };
    
    const [year, month, day] = selectedDate.split('-');
    const currentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = currentDate.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - daysFromMonday);
    
    const labels = [];
    const data = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      labels.push(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]);
      data.push(puffData[dateString] || 0);
    }
    
    return {
      labels,
      datasets: [{ data: data.length > 0 ? data : [0] }]
    };
  };

  // Get data for monthly chart
  const getMonthlyChartData = () => {
    if (!selectedDate) return { labels: [], datasets: [{ data: [0] }] };
    
    const [year, month] = selectedDate.split('-');
    const monthKey = `${year}-${month}`;
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    
    const labels = [];
    const data = [];
    const step = Math.ceil(daysInMonth / 7);
    
    for (let day = 1; day <= daysInMonth; day += step) {
      const dateString = `${year}-${month}-${day.toString().padStart(2, '0')}`;
      labels.push(day.toString());
      data.push(puffData[dateString] || 0);
    }
    
    return {
      labels,
      datasets: [{ data: data.length > 0 ? data : [0] }]
    };
  };

  // Get time-of-day distribution data
  const getTimeOfDayData = () => {
    const hourCounts = Array(24).fill(0);
    
    Object.entries(puffTimestamps).forEach(([date, timestamps]) => {
      timestamps.forEach(timestamp => {
        const hour = new Date(timestamp).getHours();
        hourCounts[hour]++;
      });
    });

    const labels = [];
    const data = [];
    for (let i = 0; i < 24; i += 3) {
      labels.push(`${i}:00`);
      data.push(hourCounts[i] + hourCounts[i+1] + hourCounts[i+2]);
    }

    return {
      labels,
      datasets: [{ data: data.some(d => d > 0) ? data : [0] }]
    };
  };

  // Get peak usage hour
  const getPeakUsageHour = () => {
    const hourCounts = Array(24).fill(0);
    
    Object.entries(puffTimestamps).forEach(([date, timestamps]) => {
      timestamps.forEach(timestamp => {
        const hour = new Date(timestamp).getHours();
        hourCounts[hour]++;
      });
    });

    const maxCount = Math.max(...hourCounts);
    const peakHour = hourCounts.indexOf(maxCount);
    
    if (maxCount === 0) return 'No data';
    
    const period = peakHour >= 12 ? 'PM' : 'AM';
    const displayHour = peakHour % 12 || 12;
    return `${displayHour}:00 ${period}`;
  };

  // Calculate weekly improvement percentage
  const getWeeklyImprovement = () => {
    if (!selectedDate) return 0;
    
    const [year, month, day] = selectedDate.split('-');
    const currentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Current week (last 7 days)
    let currentWeekTotal = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      currentWeekTotal += puffData[dateString] || 0;
    }
    
    // Previous week (days 7-13 ago)
    let previousWeekTotal = 0;
    for (let i = 7; i < 14; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      previousWeekTotal += puffData[dateString] || 0;
    }
    
    if (previousWeekTotal === 0) return 0;
    
    const improvement = ((previousWeekTotal - currentWeekTotal) / previousWeekTotal) * 100;
    return Math.round(improvement);
  };

  // Get most active time period
  const getMostActiveTimePeriod = () => {
    const periods = {
      'Morning (6-12)': 0,
      'Afternoon (12-18)': 0,
      'Evening (18-24)': 0,
      'Night (0-6)': 0
    };
    
    Object.entries(puffTimestamps).forEach(([date, timestamps]) => {
      timestamps.forEach(timestamp => {
        const hour = new Date(timestamp).getHours();
        if (hour >= 6 && hour < 12) periods['Morning (6-12)']++;
        else if (hour >= 12 && hour < 18) periods['Afternoon (12-18)']++;
        else if (hour >= 18 && hour < 24) periods['Evening (18-24)']++;
        else periods['Night (0-6)']++;
      });
    });

    const maxPeriod = Object.entries(periods).reduce((max, [period, count]) => 
      count > max.count ? { period, count } : max, 
      { period: 'No data', count: 0 }
    );

    return maxPeriod.period;
  };

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
        
        {/* Powered by Dynamic.IO */}
        <TouchableOpacity 
          style={styles.poweredByContainer}
          onPress={openDynamicIO}
          activeOpacity={0.7}
        >
          <Text style={[styles.poweredByText, { color: isDarkMode ? '#b0b0b0' : '#6c757d' }]}>
            Powered by <Text style={{ color: '#4ecdc4' }}>Dynamic.IO</Text>
          </Text>
        </TouchableOpacity>
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

                 {/* Enhanced Stats Cards with Gradients */}
         <View style={styles.statsContainer}>
           <LinearGradient
             colors={isDarkMode ? ['#1a1a1a', '#252525'] : ['#ffffff', '#f5f5f5']}
             style={styles.statCard}
           >
             <Text style={[styles.statNumber, { color: themeStyles.accentColor }]}>{getDailyAverage()}</Text>
             <Text style={[styles.statLabel, { color: themeStyles.secondaryTextColor }]}>Daily Avg</Text>
             <Text style={[styles.statSubLabel, { color: themeStyles.secondaryTextColor }]}>All Time</Text>
           </LinearGradient>
           <LinearGradient
             colors={isDarkMode ? ['#1a1a1a', '#252525'] : ['#ffffff', '#f5f5f5']}
             style={styles.statCard}
           >
             <Text style={[styles.statNumber, { color: '#ffa726' }]}>{getWeeklyAverage()}</Text>
             <Text style={[styles.statLabel, { color: themeStyles.secondaryTextColor }]}>Weekly Avg</Text>
             <Text style={[styles.statSubLabel, { color: themeStyles.secondaryTextColor }]}>Mon-Sun</Text>
           </LinearGradient>
           <LinearGradient
             colors={isDarkMode ? ['#1a1a1a', '#252525'] : ['#ffffff', '#f5f5f5']}
             style={styles.statCard}
           >
             <Text style={[styles.statNumber, { color: '#ff6b6b' }]}>{getMonthlyAverage()}</Text>
             <Text style={[styles.statLabel, { color: themeStyles.secondaryTextColor }]}>Monthly Avg</Text>
             <Text style={[styles.statSubLabel, { color: themeStyles.secondaryTextColor }]}>Per Day</Text>
           </LinearGradient>
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

          <TouchableOpacity 
            style={[styles.monthlyButton, { 
              backgroundColor: themeStyles.accentColor,
              borderColor: themeStyles.accentColor,
              shadowColor: themeStyles.shadowColor,
              marginTop: 10
            }]} 
            onPress={() => setChartsModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.monthlyButtonIcon, { fontSize: 18 }]}>📈</Text>
            <Text style={[styles.monthlyButtonText, { color: '#ffffff' }]}>
              View Trend Charts
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Insights Card */}
        <LinearGradient
          colors={isDarkMode ? ['#1a1a1a', '#2a2a2a'] : ['#f0f9ff', '#e0f2fe']}
          style={styles.insightsCardMain}
        >
          <View style={styles.insightsHeader}>
            <Text style={[styles.insightsMainTitle, { color: themeStyles.accentColor }]}>
              💡 Your Insights
            </Text>
            <TouchableOpacity 
              onPress={() => setTimeOfDayModalVisible(true)}
              style={[styles.timeOfDayButton, { backgroundColor: themeStyles.accentColor }]}
            >
              <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>⏰ Time Analysis</Text>
            </TouchableOpacity>
          </View>
          
          {(() => {
            const improvement = getWeeklyImprovement();
            const isImprovement = improvement > 0;
            const peakHour = getPeakUsageHour();
            
            return (
              <View>
                <View style={styles.insightRow}>
                  <Text style={[styles.insightIcon, { fontSize: 32 }]}>
                    {isImprovement ? '📉' : improvement < 0 ? '📈' : '➖'}
                  </Text>
                  <View style={styles.insightTextContainer}>
                    <Text style={[styles.insightMainText, { color: themeStyles.textColor }]}>
                      {isImprovement 
                        ? `Great! You've reduced usage by ${improvement}% this week!` 
                        : improvement < 0
                        ? `Usage increased by ${Math.abs(improvement)}% this week`
                        : 'Keep tracking to see your progress'}
                    </Text>
                    <Text style={[styles.insightSubText, { color: themeStyles.secondaryTextColor }]}>
                      Compared to last week
                    </Text>
                  </View>
                </View>
                
                {peakHour !== 'No data' && (
                  <View style={[styles.insightRow, { marginTop: 15 }]}>
                    <Text style={[styles.insightIcon, { fontSize: 24 }]}>⏰</Text>
                    <View style={styles.insightTextContainer}>
                      <Text style={[styles.insightMainText, { color: themeStyles.textColor, fontSize: 14 }]}>
                        Peak usage: {peakHour}
                      </Text>
                      <Text style={[styles.insightSubText, { color: themeStyles.secondaryTextColor }]}>
                        Most active: {getMostActiveTimePeriod()}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })()}
        </LinearGradient>
        
        {/* Powered by Dynamic.IO */}
        <TouchableOpacity 
          style={styles.appFooterContainer}
          onPress={openDynamicIO}
          activeOpacity={0.7}
        >
          <Text style={[styles.poweredByText, { color: themeStyles.secondaryTextColor }]}>
            Powered by <Text style={{ color: '#4ecdc4' }}>Dynamic.IO</Text>
          </Text>
        </TouchableOpacity>
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

      {/* Trend Charts Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={chartsModalVisible}
        onRequestClose={() => setChartsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeStyles.modalBackground, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeStyles.accentColor }]}>
                📈 Trend Analysis
              </Text>
              <TouchableOpacity onPress={() => setChartsModalVisible(false)}>
                <Text style={[styles.closeIconText, { color: themeStyles.secondaryTextColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              {/* Weekly Trend */}
              <View style={{ marginBottom: 30 }}>
                <Text style={[styles.chartTitle, { color: themeStyles.textColor }]}>Weekly Trend</Text>
                <Text style={[styles.chartSubtitle, { color: themeStyles.secondaryTextColor }]}>
                  Last 7 days usage pattern
                </Text>
                <LineChart
                  data={getWeeklyChartData()}
                  width={width * 0.85}
                  height={220}
                  chartConfig={{
                    backgroundColor: themeStyles.cardBackground,
                    backgroundGradientFrom: isDarkMode ? '#1a1a1a' : '#ffffff',
                    backgroundGradientTo: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#4ecdc4'
                    }
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              </View>

              {/* Monthly Trend */}
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.chartTitle, { color: themeStyles.textColor }]}>Monthly Overview</Text>
                <Text style={[styles.chartSubtitle, { color: themeStyles.secondaryTextColor }]}>
                  Current month comparison
                </Text>
                <BarChart
                  data={getMonthlyChartData()}
                  width={width * 0.85}
                  height={220}
                  chartConfig={{
                    backgroundColor: themeStyles.cardBackground,
                    backgroundGradientFrom: isDarkMode ? '#1a1a1a' : '#ffffff',
                    backgroundGradientTo: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
                    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    }
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                  showValuesOnTopOfBars
                />
              </View>

              {/* Insights Section */}
              <LinearGradient
                colors={isDarkMode ? ['#1a1a1a', '#252525'] : ['#f0f9ff', '#e0f2fe']}
                style={styles.insightsCard}
              >
                <Text style={[styles.insightsTitle, { color: themeStyles.accentColor }]}>💡 Insights</Text>
                <Text style={[styles.insightsText, { color: themeStyles.textColor }]}>
                  • Daily Average: {getDailyAverage()} puffs{'\n'}
                  • Weekly Average: {getWeeklyAverage()} puffs{'\n'}
                  • Monthly Total: {getMonthlyTotal()} puffs{'\n'}
                  • Current Streak: {getCurrentStreak()} days under goal
                </Text>
              </LinearGradient>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Time-of-Day Analysis Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={timeOfDayModalVisible}
        onRequestClose={() => setTimeOfDayModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeStyles.modalBackground, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeStyles.accentColor }]}>
                ⏰ Time-of-Day Analysis
              </Text>
              <TouchableOpacity onPress={() => setTimeOfDayModalVisible(false)}>
                <Text style={[styles.closeIconText, { color: themeStyles.secondaryTextColor }]}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ width: '100%' }} showsVerticalScrollIndicator={false}>
              {/* Usage by Time Chart */}
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.chartTitle, { color: themeStyles.textColor }]}>Usage by Time of Day</Text>
                <Text style={[styles.chartSubtitle, { color: themeStyles.secondaryTextColor }]}>
                  When you use most throughout the day
                </Text>
                <BarChart
                  data={getTimeOfDayData()}
                  width={width * 0.85}
                  height={220}
                  chartConfig={{
                    backgroundColor: themeStyles.cardBackground,
                    backgroundGradientFrom: isDarkMode ? '#1a1a1a' : '#ffffff',
                    backgroundGradientTo: isDarkMode ? '#2a2a2a' : '#f5f5f5',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(255, 167, 38, ${opacity})`,
                    labelColor: (opacity = 1) => isDarkMode ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16
                    }
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                  showValuesOnTopOfBars
                />
              </View>

              {/* Time Period Breakdown */}
              <LinearGradient
                colors={isDarkMode ? ['#1a1a1a', '#252525'] : ['#fff5e6', '#ffe6cc']}
                style={styles.timePeriodCard}
              >
                <Text style={[styles.insightsTitle, { color: '#ffa726' }]}>⏰ Time Breakdown</Text>
                
                {(() => {
                  const periods = {
                    '🌅 Morning (6AM-12PM)': 0,
                    '☀️ Afternoon (12PM-6PM)': 0,
                    '🌆 Evening (6PM-12AM)': 0,
                    '🌙 Night (12AM-6AM)': 0
                  };
                  
                  Object.entries(puffTimestamps).forEach(([date, timestamps]) => {
                    timestamps.forEach(timestamp => {
                      const hour = new Date(timestamp).getHours();
                      if (hour >= 6 && hour < 12) periods['🌅 Morning (6AM-12PM)']++;
                      else if (hour >= 12 && hour < 18) periods['☀️ Afternoon (12PM-6PM)']++;
                      else if (hour >= 18 && hour < 24) periods['🌆 Evening (6PM-12AM)']++;
                      else periods['🌙 Night (12AM-6AM)']++;
                    });
                  });

                  const total = Object.values(periods).reduce((sum, count) => sum + count, 0);

                  return (
                    <View>
                      {Object.entries(periods).map(([period, count]) => {
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                          <View key={period} style={styles.timePeriodRow}>
                            <Text style={[styles.timePeriodLabel, { color: themeStyles.textColor }]}>
                              {period}
                            </Text>
                            <View style={styles.timePeriodBar}>
                              <View style={[styles.progressBar, { backgroundColor: themeStyles.borderColor }]}>
                                <View style={[styles.progressBarFill, { 
                                  width: `${percentage}%`,
                                  backgroundColor: '#ffa726'
                                }]} />
                              </View>
                              <Text style={[styles.timePeriodValue, { color: themeStyles.textColor }]}>
                                {count} ({percentage}%)
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                      
                      <View style={[styles.peakTimeCard, { backgroundColor: isDarkMode ? '#2a2a2a' : '#fff', marginTop: 15 }]}>
                        <Text style={[styles.peakTimeText, { color: themeStyles.textColor }]}>
                          🎯 Peak Hour: <Text style={{ color: '#ffa726', fontWeight: 'bold' }}>{getPeakUsageHour()}</Text>
                        </Text>
                      </View>
                    </View>
                  );
                })()}
              </LinearGradient>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingTop: 20,
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
  appFooterContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingBottom: 20,
  },
  poweredByText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  skeletonBox: {
    borderRadius: 8,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  chartSubtitle: {
    fontSize: 14,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  insightsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 24,
  },
  insightsCardMain: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  insightsMainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  timeOfDayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightIcon: {
    marginRight: 12,
  },
  insightTextContainer: {
    flex: 1,
  },
  insightMainText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  insightSubText: {
    fontSize: 13,
    opacity: 0.8,
  },
  timePeriodCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  timePeriodRow: {
    marginBottom: 15,
  },
  timePeriodLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  timePeriodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  timePeriodValue: {
    fontSize: 13,
    fontWeight: '600',
    minWidth: 70,
  },
  peakTimeCard: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  peakTimeText: {
    fontSize: 15,
    fontWeight: '600',
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
  poweredByContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
