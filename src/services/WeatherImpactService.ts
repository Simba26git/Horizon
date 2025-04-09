import { supabase } from '@/lib/supabase';

interface WeatherForecast {
  id: string;
  location_id: string;
  forecast_date: string;
  temperature: number;
  precipitation: number;
  wind_speed: number;
  severity: 'low' | 'medium' | 'high';
}

interface ConstructionDelay {
  id: string;
  project_id: string;
  delay_date: string;
  delay_duration: number;
  weather_forecast_id: string;
  impact_description: string;
  cost_impact: number;
}

export class WeatherImpactService {
  private readonly WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  private readonly WEATHER_API_URL = 'https://api.weatherapi.com/v1';

  async getWeatherForecast(location: string, days: number = 7): Promise<WeatherForecast[]> {
    try {
      // In a real implementation, this would call an actual weather API
      const response = await fetch(
        `${this.WEATHER_API_URL}/forecast.json?key=${this.WEATHER_API_KEY}&q=${location}&days=${days}`
      );
      const data = await response.json();

      const forecasts: WeatherForecast[] = [];
      for (const day of data.forecast.forecastday) {
        const forecast: WeatherForecast = {
          id: crypto.randomUUID(),
          location_id: location,
          forecast_date: day.date,
          temperature: day.day.avgtemp_c,
          precipitation: day.day.totalprecip_mm,
          wind_speed: day.day.maxwind_kph,
          severity: this.calculateWeatherSeverity(day)
        };

        // Save forecast to database
        await supabase
          .from('weather_forecasts')
          .insert(forecast);

        forecasts.push(forecast);
      }

      return forecasts;
    } catch (error) {
      console.error('Error fetching weather forecast:', error);
      return [];
    }
  }

  private calculateWeatherSeverity(weatherData: any): 'low' | 'medium' | 'high' {
    const { condition, totalprecip_mm, maxwind_kph } = weatherData.day;
    
    if (
      totalprecip_mm > 25 || // Heavy rain
      maxwind_kph > 50 || // Strong winds
      condition.text.toLowerCase().includes('storm')
    ) {
      return 'high';
    } else if (
      totalprecip_mm > 10 ||
      maxwind_kph > 30
    ) {
      return 'medium';
    }
    return 'low';
  }

  async recordConstructionDelay(
    projectId: string,
    delayDate: string,
    delayDuration: number,
    weatherForecastId: string,
    impactDescription: string,
    costImpact: number
  ): Promise<{ delay: ConstructionDelay | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('construction_delays')
        .insert({
          project_id: projectId,
          delay_date: delayDate,
          delay_duration: delayDuration,
          weather_forecast_id: weatherForecastId,
          impact_description: impactDescription,
          cost_impact: costImpact
        })
        .select()
        .single();

      if (error) throw error;

      return { delay: data, error: null };
    } catch (error) {
      return { delay: null, error: error as Error };
    }
  }

  async getProjectDelays(projectId: string): Promise<ConstructionDelay[]> {
    const { data, error } = await supabase
      .from('construction_delays')
      .select(`
        *,
        weather_forecasts (*)
      `)
      .eq('project_id', projectId)
      .order('delay_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async analyzeWeatherImpact(projectId: string): Promise<{
    totalDelays: number;
    totalCostImpact: number;
    highSeverityDays: number;
    recommendations: string[];
  }> {
    const delays = await this.getProjectDelays(projectId);
    
    const totalDelays = delays.reduce((sum, delay) => sum + delay.delay_duration, 0);
    const totalCostImpact = delays.reduce((sum, delay) => sum + delay.cost_impact, 0);
    const highSeverityDays = delays.filter(
      delay => delay.weather_forecasts.severity === 'high'
    ).length;

    const recommendations = this.generateRecommendations(delays);

    return {
      totalDelays,
      totalCostImpact,
      highSeverityDays,
      recommendations
    };
  }

  private generateRecommendations(delays: ConstructionDelay[]): string[] {
    const recommendations: string[] = [];

    // Analyze patterns and generate recommendations
    if (delays.length > 0) {
      const averageDelay = delays.reduce((sum, d) => sum + d.delay_duration, 0) / delays.length;
      
      if (averageDelay > 5) {
        recommendations.push('Consider adding more buffer time to project timeline');
      }

      const highSeverityCount = delays.filter(d => d.weather_forecasts.severity === 'high').length;
      if (highSeverityCount > delays.length * 0.3) {
        recommendations.push('Review project schedule to avoid seasonal weather impacts');
      }

      const costImpact = delays.reduce((sum, d) => sum + d.cost_impact, 0);
      if (costImpact > 10000) {
        recommendations.push('Implement weather protection measures to reduce delay costs');
      }
    }

    return recommendations;
  }
}

export const weatherImpactService = new WeatherImpactService(); 