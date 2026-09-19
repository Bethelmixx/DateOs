-- Tie reports, votes and profiles to existing users.

delete from report_votes v
 where not exists (select 1 from profiles p where p.user_id = v.user_id);

delete from reports r
 where not exists (select 1 from profiles p where p.user_id = r.user_id);

delete from profiles p
 where not exists (select 1 from "user" u where u.id = p.user_id);

alter table profiles
  drop constraint if exists profiles_user_fk;
alter table profiles
  add constraint profiles_user_fk
  foreign key (user_id) references "user" (id) on delete cascade;

alter table reports
  drop constraint if exists reports_user_fk;
alter table reports
  add constraint reports_user_fk
  foreign key (user_id) references profiles (user_id) on delete cascade;

alter table report_votes
  drop constraint if exists report_votes_user_fk;
alter table report_votes
  add constraint report_votes_user_fk
  foreign key (user_id) references profiles (user_id) on delete cascade;
