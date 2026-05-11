/**
 * Survival Mode - Battery-aware network throttling
 */
import { Haptics } from './haptics';

export let currentBatteryLevel = 100;
export let isCharging = false;
export let survivalLevel = 'NORMAL'; // NORMAL, LOW, CRITICAL

const evaluateSurvivalState = () => {
  if (isCharging) {
    survivalLevel = 'NORMAL';
    return;
  }
  
  if (currentBatteryLevel <= 10) {
    if (survivalLevel !== 'CRITICAL') {
      survivalLevel = 'CRITICAL';
      Haptics.error();
    }
  } else if (currentBatteryLevel <= 20) {
    if (survivalLevel !== 'LOW') {
      survivalLevel = 'LOW';
      Haptics.error();
    }
  } else {
    if (survivalLevel !== 'NORMAL') {
      survivalLevel = 'NORMAL';
    }
  }
};

export const initSurvivalMode = async () => {
  if ('getBattery' in navigator) {
    try {
      const battery = await navigator.getBattery();
      currentBatteryLevel = battery.level * 100;
      isCharging = battery.charging;
      evaluateSurvivalState();

      battery.addEventListener('levelchange', () => {
        currentBatteryLevel = battery.level * 100;
        evaluateSurvivalState();
      });
      
      battery.addEventListener('chargingchange', () => {
        isCharging = battery.charging;
        evaluateSurvivalState();
      });
    } catch (e) {
      console.warn("Battery API not available");
    }
  }
};
