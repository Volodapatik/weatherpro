import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [weather, setWeather] = useState<any>(null);
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);

      // Fetch weather from Open-Meteo API
      const weatherResponse = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=50.4501&longitude=30.5234&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,pressure_msl,uv_index,cloud_cover&timezone=auto'
      );

      const weatherData = await weatherResponse.json();
      const current = weatherData.current;

      setWeather({
        temperature: Math.round(current.temperature_2m),
        feelsLike: Math.round(current.apparent_temperature),
        humidity: current.relative_humidity_2m,
        windSpeed: Math.round(current.wind_speed_10m),
        pressure: current.pressure_msl,
        uvIndex: current.uv_index,
        cloudCover: current.cloud_cover,
      });

      // Fetch description from Groq LLM
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer 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',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'user',
                content: `Ви - метеоролог. Опишіть погоду в Києві українською мовою на основі цих даних:

Температура: ${current.temperature_2m}°C (відчувається як ${current.apparent_temperature}°C)
Вологість: ${current.relative_humidity_2m}%
Вітер: ${Math.round(current.wind_speed_10m)} км/год
Тиск: ${current.pressure_msl} гПа
УФ індекс: ${current.uv_index}
Хмарність: ${current.cloud_cover}%

Дайте короткий, інформативний опис (2-3 речення).`,
              },
            ],
            temperature: 0.7,
            max_tokens: 300,
          }),
        });

        const groqData = await groqResponse.json();
        if (groqData.choices && groqData.choices[0]) {
          setDescription(groqData.choices[0].message.content);
        } else {
          setDescription('Не вдалося отримати опис');
        }
      } catch (groqError) {
        console.error('Groq error:', groqError);
        setDescription('Помилка при отриманні опису від LLM');
      }
    } catch (error) {
      console.error('Error:', error);
      setDescription('Помилка при завантаженні даних');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  if (loading && !weather) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Завантаження погоди...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>WeatherPro</Text>
          <Text style={styles.location}>Київ, Україна</Text>
        </View>

        {weather && (
          <>
            <View style={styles.mainCard}>
              <Text style={styles.emoji}>☁️</Text>
              <Text style={styles.temperature}>{weather.temperature}°C</Text>
              <Text style={styles.feelsLike}>Відчувається як {weather.feelsLike}°C</Text>
            </View>

            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>💧</Text>
                <Text style={styles.detailLabel}>Вологість</Text>
                <Text style={styles.detailValue}>{weather.humidity}%</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>💨</Text>
                <Text style={styles.detailLabel}>Вітер</Text>
                <Text style={styles.detailValue}>{weather.windSpeed} км/год</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🔽</Text>
                <Text style={styles.detailLabel}>Тиск</Text>
                <Text style={styles.detailValue}>{weather.pressure} гПа</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>☀️</Text>
                <Text style={styles.detailLabel}>УФ індекс</Text>
                <Text style={styles.detailValue}>{weather.uvIndex}</Text>
              </View>
            </View>

            {description && (
              <View style={styles.descriptionCard}>
                <View style={styles.descriptionHeader}>
                  <Text style={styles.descriptionIcon}>ℹ️</Text>
                  <Text style={styles.descriptionTitle}>Опис погоди</Text>
                </View>
                <Text style={styles.descriptionText}>{description}</Text>
              </View>
            )}
          </>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>🔄 Оновити</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212121',
  },
  location: {
    fontSize: 16,
    color: '#999',
    marginTop: 4,
  },
  mainCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  emoji: {
    fontSize: 64,
  },
  temperature: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginTop: 12,
  },
  feelsLike: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  detailsCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  detailIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  descriptionCard: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1E88E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  descriptionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E88E5',
  },
  descriptionText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
    fontWeight: '500',
  },
  refreshButton: {
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
