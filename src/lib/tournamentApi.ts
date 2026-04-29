import http from './api';

export const removeParticipant = async (tournamentId: string, participantId: string, token: string) => {
  const res = await http.delete(
    `/api/tournaments/${tournamentId}/participants/${participantId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export default {
  removeParticipant,
};
