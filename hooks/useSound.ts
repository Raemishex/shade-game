"use client";

import { useCallback, useRef, useEffect } from "react";
import SoundManager from "@/lib/sounds";
import type { SoundName } from "@/lib/sounds";

/**
 * SHADE səs sistemi hook-u
 * Komponentlərdə rahat istifadə üçün
 */
export function useSound() {
  const managerRef = useRef<SoundManager | null>(null);

  useEffect(() => {
    managerRef.current = SoundManager.getInstance();
  }, []);

  const getManager = useCallback(() => {
    if (!managerRef.current) {
      managerRef.current = SoundManager.getInstance();
    }
    return managerRef.current;
  }, []);

  // --- SFX shortcuts ---
  const playClick = useCallback(() => getManager().playSfx("button_click"), [getManager]);
  const playFlip = useCallback(() => getManager().playSfx("card_flip"), [getManager]);
  const playClueSubmit = useCallback(() => getManager().playSfx("clue_submit"), [getManager]);
  const playTimerTick = useCallback(() => getManager().playSfx("timer_tick"), [getManager]);
  const playTimerEnd = useCallback(() => getManager().playSfx("timer_end"), [getManager]);
  const playVoteCast = useCallback(() => getManager().playSfx("vote_cast"), [getManager]);
  const playEmoji = useCallback(() => getManager().playSfx("emoji_send"), [getManager]);
  const playPlayerJoin = useCallback(() => getManager().playSfx("player_join"), [getManager]);
  const playPlayerLeave = useCallback(() => getManager().playSfx("player_leave"), [getManager]);
  const playReveal = useCallback(() => getManager().playSfx("reveal_sound"), [getManager]);

  // --- BG music shortcuts ---
  const playLobbyMusic = useCallback(() => getManager().playBg("lobby_music"), [getManager]);
  const playGameMusic = useCallback(() => getManager().playBg("game_music"), [getManager]);
  const playVotingMusic = useCallback(() => getManager().playBg("voting_music"), [getManager]);
  const playVictoryMusic = useCallback(() => getManager().playBg("victory_music"), [getManager]);
  const playDefeatMusic = useCallback(() => getManager().playBg("defeat_music"), [getManager]);
  const stopMusic = useCallback(() => getManager().stopBg(), [getManager]);

  // --- Controls ---
  const toggleMute = useCallback(() => getManager().toggleMute(), [getManager]);
  const setMusicVolume = useCallback((v: number) => getManager().setMusicVolume(v), [getManager]);
  const setSfxVolume = useCallback((v: number) => getManager().setSfxVolume(v), [getManager]);

  // --- Generic ---
  const playSfx = useCallback((name: SoundName) => getManager().playSfx(name), [getManager]);
  const playBg = useCallback((name: SoundName) => getManager().playBg(name), [getManager]);

  return {
    // SFX
    playClick,
    playFlip,
    playClueSubmit,
    playTimerTick,
    playTimerEnd,
    playVoteCast,
    playEmoji,
    playPlayerJoin,
    playPlayerLeave,
    playReveal,
    // BG
    playLobbyMusic,
    playGameMusic,
    playVotingMusic,
    playVictoryMusic,
    playDefeatMusic,
    stopMusic,
    // Controls
    toggleMute,
    setMusicVolume,
    setSfxVolume,
    // Generic
    playSfx,
    playBg,
  };
}
