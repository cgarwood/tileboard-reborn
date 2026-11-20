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

  // The store keeps the subscription across disconnects and resubscribes once connected,
  // so this only follows the entity and forecast type.
  const stopWatch = watch(
    [entityId, forecastType],
    ([id, type]) => {
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
