<template>
  <component :is="component" :widget="widget" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Widget } from '../types/widgets';
import SpacerWidget from '../widgets/SpacerWidget.vue';
import SensorWidget from '../widgets/SensorWidget.vue';
import SwitchWidget from '../widgets/SwitchWidget.vue';
import WeatherWidget from '../widgets/WeatherWidget.vue';
import ClimateWidget from '../widgets/ClimateWidget.vue';
import ButtonWidget from '../widgets/ButtonWidget.vue';
import FanWidget from '../widgets/FanWidget.vue';
import NumberWidget from '../widgets/NumberWidget.vue';
import CalendarWidget from '../widgets/CalendarWidget.vue';
import ErrorWidget from '../widgets/ErrorWidget.vue';

const WIDGET_MAP: Record<string, unknown> = {
  spacer: SpacerWidget,
  sensor: SensorWidget,
  switch: SwitchWidget,
  weather: WeatherWidget,
  climate: ClimateWidget,
  button: ButtonWidget,
  fan: FanWidget,
  number: NumberWidget,
  calendar: CalendarWidget,
};

const props = defineProps<{ widget: Widget }>();

const component = computed(() => WIDGET_MAP[props.widget.type] ?? ErrorWidget);
</script>
