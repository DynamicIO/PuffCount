import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar, Animated, Modal, Switch } from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  return `${month}-${day}-${year}`;
};

const getMonthName = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'long' });
};

export default function App() {
  const [puffData, setPuffData] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [puffCount, setPuffCount] = useState(0);
  const [buttonScale] = useState(new Animated.Value(1));
  const [monthlyModalVisible, setMonthlyModalVisible] = useState(false);
  const [monthlyPuffs, setMonthlyPuffs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadPuffData();
    loadThemePreference();
  }, []);

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
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
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
      marked[date] = {
        marked: true,
        dotColor: isDarkMode ? '#7a7a7a' : '#50cebb',
        text: `${puffData[date]} puffs`
      };
    });
    
    // Mark the selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: isDarkMode ? '#7a7a7a' : '#50cebb',
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

  // Theme-based styles
  const themeStyles = {
    backgroundColor: isDarkMode ? '#121212' : '#fff',
    textColor: isDarkMode ? '#f0f0f0' : '#333',
    secondaryTextColor: isDarkMode ? '#aaa' : '#666',
    cardBackground: isDarkMode ? '#1e1e1e' : '#f9f9f9',
    borderColor: isDarkMode ? '#333' : '#f0f0f0',
    accentColor: isDarkMode ? '#7a7a7a' : '#50cebb',
    modalBackground: isDarkMode ? '#1e1e1e' : 'white',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeStyles.backgroundColor }]}>
      <ScrollView style={[styles.container, { backgroundColor: themeStyles.backgroundColor }]}>
        <View style={styles.headerContainer}>
          <Text style={[styles.title, { color: themeStyles.accentColor }]}>Puff Tracker</Text>
          <View style={styles.themeToggleContainer}>
            <Text style={[styles.themeToggleText, { color: themeStyles.textColor }]}>Dark Mode</Text>
            <Switch
              trackColor={{ false: '#767577', true: '#7a7a7a' }}
              thumbColor={isDarkMode ? '#50cebb' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleDarkMode}
              value={isDarkMode}
            />
          </View>
        </View>
        
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={getMarkedDates()}
            theme={{
              todayTextColor: themeStyles.accentColor,
              selectedDayBackgroundColor: themeStyles.accentColor,
              selectedDayTextColor: '#ffffff',
              textColor: themeStyles.textColor,
              textDisabledColor: themeStyles.secondaryTextColor,
              monthTextColor: themeStyles.textColor,
              arrowColor: themeStyles.accentColor,
              backgroundColor: themeStyles.backgroundColor,
              calendarBackground: themeStyles.backgroundColor,
              dayTextColor: themeStyles.textColor,
            }}
          />
        </View>
        
        <View style={[styles.counterContainer, { backgroundColor: themeStyles.cardBackground }]}>
          <Text style={[styles.dateText, { color: themeStyles.textColor }]}>{formatDate(selectedDate)}</Text>
          <Text style={[styles.countText, { color: themeStyles.textColor }]}>Puffs: {puffCount}</Text>
          
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: themeStyles.accentColor }]} 
                onPress={incrementPuff}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>Add Puff</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.removeButton, { backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0' }]} 
                onPress={decrementPuff}
                activeOpacity={0.8}
                disabled={puffCount === 0}
              >
                <Text style={[styles.buttonText, { color: themeStyles.accentColor }]}>Remove Puff</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          <TouchableOpacity 
            style={[styles.monthlyButton, { 
              backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0',
              borderColor: themeStyles.accentColor 
            }]} 
            onPress={showMonthlyPuffs}
            activeOpacity={0.8}
          >
            <Text style={[styles.monthlyButtonText, { color: themeStyles.accentColor }]}>View Monthly Puffs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={monthlyModalVisible}
        onRequestClose={() => setMonthlyModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: themeStyles.modalBackground }]}>
            <Text style={[styles.modalTitle, { color: themeStyles.accentColor }]}>{currentMonth} Puffs</Text>
            
            <ScrollView style={styles.monthlyList}>
              {monthlyPuffs.length > 0 ? (
                monthlyPuffs.map((item, index) => (
                  <View key={index} style={[styles.monthlyItem, { borderBottomColor: themeStyles.borderColor }]}>
                    <Text style={[styles.monthlyDate, { color: themeStyles.textColor }]}>{item.date}</Text>
                    <Text style={[styles.monthlyCount, { color: themeStyles.accentColor }]}>{item.count} puffs</Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noDataText, { color: themeStyles.secondaryTextColor }]}>No puffs recorded for this month</Text>
              )}
            </ScrollView>
            
            <View style={[styles.monthlyTotal, { borderTopColor: themeStyles.borderColor }]}>
              <Text style={[styles.totalLabel, { color: themeStyles.textColor }]}>Total Puffs:</Text>
              <Text style={[styles.totalCount, { color: themeStyles.accentColor }]}>{calculateMonthlyTotal()}</Text>
            </View>
            
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: themeStyles.accentColor }]} 
              onPress={() => setMonthlyModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  themeToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggleText: {
    fontSize: 16,
    marginRight: 10,
  },
  calendarContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  counterContainer: {
    padding: 20,
    alignItems: 'center',
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  countText: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
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
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  removeButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#50cebb',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  monthlyButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  monthlyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
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
  monthlyCount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
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
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
