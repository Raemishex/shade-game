"use client";

import { useEffect, useState, useCallback } from "react";
import { getSocket } from "@/lib/socket";
import type { GameWordData, Clue, ChatMessage, VoteResult, GameEndData } from "@/types";

interface RoundClues {
  roundNumber: number;
  clues: Clue[];
}

interface GameState {
  wordData: GameWordData | null;
  currentRound: number;
  clues: Clue[];
  allRoundClues: RoundClues[];
  isDiscussion: boolean;
  discussionTime: number | null;
  discussionTimeLeft: number | null;
  isVoting: boolean;
  voteResult: VoteResult | null;
  gameEnd: GameEndData | null;
  messages: ChatMessage[];
  roundTransition: number | null;
}

export function useGame(roomCode?: string) {
  const [state, setState] = useState<GameState>({
    wordData: null,
    currentRound: 0,
    clues: [],
    allRoundClues: [],
    isDiscussion: false,
    discussionTime: null,
    discussionTimeLeft: null,
    isVoting: false,
    voteResult: null,
    gameEnd: null,
    messages: [],
    roundTransition: null,
  });

  useEffect(() => {
    const socket = getSocket();

    function requestGameState() {
      console.log(`[useGame] requestGameState called, connected=${socket.connected}, roomCode=${roomCode}`);
      if (!roomCode) return;

      socket.emit("room:join", { roomCode }, (response) => {
        console.log(`[useGame] room:join callback: success=${response?.success}`);
        if (response?.success) {
          socket.emit("game:requestState", { roomCode });
        }
      });
    }

    if (socket.connected) {
      requestGameState();
    }
    socket.on("connect", requestGameState);

    // BUG 3.2 fix: Retry yalnız wordData null olanda (yəni oyun başladıqda)
    const retryTimers: ReturnType<typeof setTimeout>[] = [];
    [1000, 3000, 6000].forEach((delay) => {
      const timer = setTimeout(() => {
        setState((prev) => {
          if (!prev.wordData && socket.connected && roomCode) {
            console.log(`[useGame] Retry requestGameState after ${delay}ms`);
            socket.emit("game:requestState", { roomCode });
          }
          return prev;
        });
      }, delay);
      retryTimers.push(timer);
    });

    // Handler ref-ləri — cleanup-da düzgün silmək üçün
    function onGameWord(data: GameWordData) {
      console.log(`[useGame] game:word received! role=${data.role}, word=${data.word ? "***" : "null"}`);
      setState((prev) => ({ ...prev, wordData: data }));
    }

    let roundTransitionTimer: ReturnType<typeof setTimeout> | null = null;

    function onRoundStart(roundNumber: number) {
      setState((prev) => {
        const newAllRoundClues = [...prev.allRoundClues];
        if (prev.currentRound > 0 && prev.clues.length > 0) {
          if (!newAllRoundClues.find((r) => r.roundNumber === prev.currentRound)) {
            newAllRoundClues.push({
              roundNumber: prev.currentRound,
              clues: prev.clues,
            });
          }
        }

        return {
          ...prev,
          currentRound: roundNumber,
          clues: [],
          allRoundClues: newAllRoundClues,
          roundTransition: roundNumber > 1 ? roundNumber : null,
        };
      });

      if (roundNumber > 1) {
        // Əvvəlki timeri təmizlə (memory leak qarşısını al)
        if (roundTransitionTimer) clearTimeout(roundTransitionTimer);
        roundTransitionTimer = setTimeout(() => {
          setState((prev) => ({ ...prev, roundTransition: null }));
          roundTransitionTimer = null;
        }, 2000);
      }
    }

    function onClueUpdate(clues: Clue[]) {
      setState((prev) => ({ ...prev, clues }));
    }

    function onRoundEnd(roundNumber: number) {
      setState((prev) => {
        const newAllRoundClues = [...prev.allRoundClues];
        if (!newAllRoundClues.find((r) => r.roundNumber === roundNumber)) {
          newAllRoundClues.push({
            roundNumber,
            clues: prev.clues,
          });
        }
        return { ...prev, allRoundClues: newAllRoundClues };
      });
    }

    function onDiscussionStart(duration: number) {
      setState((prev) => ({
        ...prev,
        isDiscussion: true,
        discussionTime: duration,
        discussionTimeLeft: duration,
      }));
    }

    function onDiscussionTimer(secondsLeft: number) {
      setState((prev) => ({ ...prev, discussionTimeLeft: secondsLeft }));
    }

    function onDiscussionEnd() {
      setState((prev) => ({
        ...prev,
        isDiscussion: false,
        discussionTime: null,
        discussionTimeLeft: null,
      }));
    }

    function onDiscussionMessage(message: ChatMessage) {
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages.slice(-99), message],
      }));
    }

    function onVotingStart() {
      setState((prev) => ({
        ...prev,
        isVoting: true,
        isDiscussion: false,
        voteResult: null,
      }));
    }

    function onVoteResult(result: VoteResult) {
      setState((prev) => ({
        ...prev,
        isVoting: false,
        voteResult: result,
      }));
    }

    function onGameEnd(data: GameEndData) {
      setState((prev) => ({ ...prev, gameEnd: data }));
    }

    // Listener-ləri qeydiyyatdan keçir
    socket.on("game:word", onGameWord);
    socket.on("round:start", onRoundStart);
    socket.on("clue:update", onClueUpdate);
    socket.on("round:end", onRoundEnd);
    socket.on("discussion:start", onDiscussionStart);
    socket.on("discussion:timer", onDiscussionTimer);
    socket.on("discussion:end", onDiscussionEnd);
    socket.on("discussion:message", onDiscussionMessage);
    socket.on("voting:start", onVotingStart);
    socket.on("vote:result", onVoteResult);
    socket.on("game:end", onGameEnd);

    return () => {
      retryTimers.forEach(clearTimeout);
      if (roundTransitionTimer) clearTimeout(roundTransitionTimer);
      socket.off("connect", requestGameState);
      socket.off("game:word", onGameWord);
      socket.off("round:start", onRoundStart);
      socket.off("clue:update", onClueUpdate);
      socket.off("round:end", onRoundEnd);
      socket.off("discussion:start", onDiscussionStart);
      socket.off("discussion:timer", onDiscussionTimer);
      socket.off("discussion:end", onDiscussionEnd);
      socket.off("discussion:message", onDiscussionMessage);
      socket.off("voting:start", onVotingStart);
      socket.off("vote:result", onVoteResult);
      socket.off("game:end", onGameEnd);
    };
  }, [roomCode]);

  const submitClue = useCallback((clue: string) => {
    const socket = getSocket();
    socket.emit("clue:submit", { clue });
  }, []);

  const castVote = useCallback((votedFor: string | null) => {
    const socket = getSocket();
    socket.emit("vote:cast", { votedFor });
  }, []);

  const sendMessage = useCallback((message: string) => {
    const socket = getSocket();
    socket.emit("discussion:message", { message });
  }, []);

  const resetGame = useCallback(() => {
    setState({
      wordData: null,
      currentRound: 0,
      clues: [],
      allRoundClues: [],
      isDiscussion: false,
      discussionTime: null,
      discussionTimeLeft: null,
      isVoting: false,
      voteResult: null,
      gameEnd: null,
      messages: [],
      roundTransition: null,
    });
  }, []);

  return {
    ...state,
    submitClue,
    castVote,
    sendMessage,
    resetGame,
  };
}
