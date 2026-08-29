alter type public.rookie_position add value if not exists 'QB' before 'RB';
alter type public.rookie_position add value if not exists 'TE' after 'WR';

comment on type public.rookie_position is
  'Supported explainable rookie-engine positions: QB, RB, WR, and TE.';
