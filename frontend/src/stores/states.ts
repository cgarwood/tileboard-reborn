import { defineStore, acceptHMRUpdate } from 'pinia';

export const useStateStore = defineStore('stateStore', {
  state: () => ({}),
  getters: {},
  actions: {},
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStateStore, import.meta.hot));
}
