import http from './api';

export const removeParticipant = async (tournamentId: string, participantId: string, token: string) => {
  const res = await http.delete(
    `/api/tournaments/${tournamentId}/participants/${participantId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getMyTournamentBet = async (tournamentId: string, token: string) => {
  const res = await http.get(`/api/tournaments/${tournamentId}/bets/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const placeTournamentBet = async (
  tournamentId: string,
  payload: { targetParticipantId: string; stake: number },
  token: string
) => {
  const res = await http.post(`/api/tournaments/${tournamentId}/bets`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default {
  removeParticipant,
  getMyTournamentBet,
  placeTournamentBet,
};
