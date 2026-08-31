export type Photographer = {
  id: string;
  nickname: string;
  handle: string;
  avatar: string;
  cover: string;
  intro: string;
  location: string;
  styleTags: string[];
  workIds: string[];
  worksCount: number;
  followers: number;
  following: number;
  isFollowing: boolean;
  isPrototype: true;
};
