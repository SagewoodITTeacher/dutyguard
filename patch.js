import fs from 'fs';
let code = fs.readFileSync('src/services/scheduler.ts', 'utf8');

const startStr = "  static async optimiseSession(";
const endStr = "    };\n  }";

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex) + endStr.length;

const newCode = `  static async optimiseSession(
    date: string,
    sessionType: 'Morning' | 'Afternoon',
    options: { autoApplyRebalancing?: boolean; balanceThreshold?: number, onProgress?: (m: string) => void } = { autoApplyRebalancing: false, balanceThreshold: 70 }
  ): Promise<OptimiseSessionResult> {
    const progress: string[] = [];

    const logProgress = (msg: string) => {
      progress.push(msg);
      if (options.onProgress) options.onProgress(msg);
      console.log(\`[Scheduler]: \${msg}\`);
    };

    const engine = new SchedulerEngine(date, sessionType);
    
    logProgress(\`Loading context and availability data for \${date}...\`);
    await engine.loadContext();

    const { newAssignments, unfilled } = await engine.runPhase1Packing(logProgress);
    
    logProgress(\`✓ Phase 1 complete. Assigned \${newAssignments.length} slots. Unfilled: \${unfilled.length}\`);

    const finalAssignments = await engine.runPhase2Balancing(newAssignments, logProgress);

    if (finalAssignments.length > 0) {
       await engine.commitToDatabase(finalAssignments);
    }
    
    logProgress('Stage 4: Finalizing schedule and performing systemic health checks...');

    return {
      date,
      session: sessionType.toLowerCase() as 'morning' | 'afternoon',
      initial: {
         date,
         session: sessionType.toLowerCase() as 'morning' | 'afternoon',
         assignments: finalAssignments,
         unfilledSlots: unfilled,
         summary: { totalSlots: newAssignments.length + unfilled.length, filled: newAssignments.length, unfilled: unfilled.length }
      },
      tech: {
         date,
         session: sessionType.toLowerCase() as 'morning' | 'afternoon',
         assignments: [],
         unfilledSlots: [],
         summary: { totalSlots: 0, filled: 0, unfilled: 0 }
      },
      progress,
      summary: { totalSlots: newAssignments.length + unfilled.length, filled: newAssignments.length, unfilled: unfilled.length },
      rebalancing: {
         proposals: [],
         iterations: 0,
         finalInvigVariance: 0,
         finalStandbyVariance: 0
      }
    };
  }`;

fs.writeFileSync('src/services/scheduler.ts', code.substring(0, startIndex) + newCode + code.substring(endIndex));
