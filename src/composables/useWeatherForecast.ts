import { computed, onUnmounted, watch } from 'vue';
import { useHomeAssistantStore } from '../stores/home-assistant';
import type { ForecastType, WeatherForecast } from '../types/weather';

export function useWeatherForecast(
  entityId: () => string | undefined,
  forecastType: () => ForecastType | null,
) {
  const haStore = useHomeAssistantStore();

  // Track what we're currently subscribed to so we can cleanly swap when type changes.
  let currentSub: { entityId: string; forecastType: ForecastType } | null = null;

  function doSubscribe(id: string, type: ForecastType) {
    if (currentSub?.entityId === id && currentSub.forecastType === type) return;
    if (currentSub) haStore.unsubscribeWeatherForecast(currentSub.entityId, currentSub.forecastType);
    haStore.subscribeWeatherForecast(id, type);
    currentSub = { entityId: id, forecastType: type };
  }

  function doUnsubscribe() {
    if (!currentSub) return;
    haStore.unsubscribeWeatherForecast(currentSub.entityId, currentSub.forecastType);
    currentSub = null;
  }

  const stopWatch = watch(
    [() => haStore.connected, entityId, forecastType],
    ([connected, id, type]) => {
      if (!connected) {
        // Store clears all data on disconnect; just reset our tracking.
        currentSub = null;
        return;
      }
      if (!id || !type) {
        doUnsubscribe();
        return;
      }
      doSubscribe(id, type);
    },
    { immediate: true },
  );

  onUnmounted(() => {
    stopWatch();
    doUnsubscribe();
  });

  const forecasts = computed<WeatherForecast[] | null>(() => {
    const id = entityId();
    const type = forecastType();
    if (!id || !type) return null;
    return haStore.weatherForecasts[id]?.[type] ?? null;
  });

  return { forecasts };
}
