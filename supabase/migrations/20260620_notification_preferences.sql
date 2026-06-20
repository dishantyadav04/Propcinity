-- 20260620_notification_preferences.sql
-- Add notification preference columns to user_profiles

alter table user_profiles add column if not exists notif_email boolean default true;
alter table user_profiles add column if not exists notif_sms boolean default false;
alter table user_profiles add column if not exists notif_updates boolean default true;
