export type Account = {
  readonly name: string;
  readonly avatarURL: string;
};

export type Post = {
  readonly id: number;
  readonly author: Account;
  readonly topics: ReadonlyArray<GroupTopic>;
  readonly content: string;
};

export type GroupTopic = {
  readonly displayName: string;
};

export type InboxItem =
  | {
      readonly kind: InboxItemKind.Post;
      readonly id: number;
      readonly reason: InboxItemPostReason;
      readonly author: Account;
      readonly topics: ReadonlyArray<GroupTopic>;
      readonly contentPreview: string;
    }
  | {
      readonly kind: InboxItemKind.Comment;
      readonly id: number;
      readonly reason: InboxItemCommentReason;
      readonly author: Account;
      readonly contentPreview: string;
    };

export enum InboxItemKind {
  Post,
  Comment,
}

export enum InboxItemPostReason {
  Mention,
  TopicSubscription,
}

export enum InboxItemCommentReason {
  Mention,
  PostAuthor,
  PostSubscription,
}

// NOTE: Ordered alphabetically.

export const baruchHen: Account = {
  name: "Baruch",
  avatarURL:
    "https://pbs.twimg.com/profile_images/1022636637891776512/vCciX6oJ_400x400.jpg",
};

export const calebMeredith: Account = {
  name: "Caleb",
  avatarURL:
    "https://pbs.twimg.com/profile_images/1040125515665879040/jrLzK1ta_400x400.jpg",
};

export const courtneyCross: Account = {
  name: "Courtney",
  avatarURL:
    "https://pbs.twimg.com/profile_images/718588760003383296/2AG8omMO.jpg",
};

export const dominicGozza: Account = {
  name: "Dominic",
  avatarURL:
    "https://pbs.twimg.com/profile_images/847609679974768641/WDwlVYbD_400x400.jpg",
};

export const josephCollins: Account = {
  name: "Joseph",
  avatarURL:
    "https://images-na.ssl-images-amazon.com/images/M/MV5BMTc3MzY3MjQ3OV5BMl5BanBnXkFtZTcwODI3NjQxMw@@._V1_UY256_CR6,0,172,256_AL_.jpg",
};

export const kateEfimova: Account = {
  name: "Kate",
  avatarURL:
    "https://pbs.twimg.com/profile_images/1095949370564870144/kwTdCHWU_400x400.png",
};

export const marcelloGozza: Account = {
  name: "Marcello",
  avatarURL:
    "https://pbs.twimg.com/profile_images/800702652485160961/R5ZZVj--_400x400.jpg",
};

export const programmingHelp: GroupTopic = {
  displayName: "Programming Help",
};

export const inbox: Array<InboxItem> = [
  {
    kind: InboxItemKind.Comment,
    id: 1,
    reason: InboxItemCommentReason.PostSubscription,
    author: baruchHen,
    contentPreview:
      "encode, encrypt, print on paper, send w/ a pigeon, upon receiving of pigeon mail, use machine learning to decipher paper to string, reverse encryption on string, decode.",
  },
  {
    kind: InboxItemKind.Post,
    id: 2,
    reason: InboxItemPostReason.TopicSubscription,
    author: kateEfimova,
    topics: [programmingHelp],
    contentPreview:
      "Anyone here who bought one of the two Wes Bros' React courses? I'm considering getting it and wanted to hear some reviews 🙂",
  },
  {
    kind: InboxItemKind.Post,
    id: 3,
    reason: InboxItemPostReason.Mention,
    author: josephCollins,
    topics: [],
    contentPreview:
      "@Caleb @Baruch If you like a lot of cool podcasts you guys should watch some of the Impact Theory episodes. The host is Tom Bilyeu who started Quest nutrition. But some of the episodes he does are insane. One with David Goggins is amazing among many other ones.",
  },
  {
    kind: InboxItemKind.Post,
    id: 4,
    reason: InboxItemPostReason.TopicSubscription,
    author: marcelloGozza,
    topics: [programmingHelp],
    contentPreview:
      "anyone ever deal with uploading files, possibly multiple files at the same time? I've done this a few different ways in the past, I'm looking for a super robust / scalable solution",
  },
];

export const feed: Array<Post> = [
  {
    id: 5,
    author: courtneyCross,
    topics: [],
    content: "what happened to DOGE life",
  },
  {
    id: 6,
    author: dominicGozza,
    topics: [],
    content:
      "I’m sad that indiehackers.com doesn’t have a mobile app. But if you don’t already read the content on the site. Start here: https://www.indiehackers.com/interviews/page/1",
  },
  {
    id: 7,
    author: kateEfimova,
    topics: [],
    content: "By the way, @Baruch, why do you have Sonic meme as ur avatar? 😉",
  },
  {
    id: 8,
    author: baruchHen,
    topics: [],
    content:
      "never heard of bluebottle in my life, until Caleb and I went there to meet Jeff from the podcasts, now my feed is full of blue bottle ads",
  },
  {
    id: 9,
    author: marcelloGozza,
    topics: [],
    content: "Thoughts? https://brave.com",
  },
];
