export type Announcement = {
  id: number;
  authorId: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
};

export type Challenge = {
  id: number;
  authorId: string;
  title: string;
  prompt: string;
  category: string;
  status: string;
  deadline: string | null;
  createdAt: string;
  submissionCount: number;
};

export type Submission = {
  id: number;
  challengeId: number;
  userId: string;
  authorName: string;
  title: string;
  body: string;
  isWinner: boolean;
  createdAt: string;
};

export type MySubmission = Submission & {
  challengeTitle: string;
  challengeStatus: string;
};

export type LotteryPrize = {
  id: number;
  ticketCode: string;
  prize: string;
  sponsor: string | null;
  claimed: boolean;
};

export type AlmanacEntry = {
  id: number;
  year: number;
  section: string;
  winnerName: string;
  title: string;
  body: string;
};

export type Profile = {
  userId: string;
  displayName: string;
  isEditor: boolean;
  wantsUpdates: boolean;
  lastSeenAt: string | null;
};
