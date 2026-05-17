import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { SchedulerEngine } from './src/services/scheduler.js';  // Can't import TS directly probably unless via tsx
dotenv.config();

// Since we are running outside browser, let's just use tsx
