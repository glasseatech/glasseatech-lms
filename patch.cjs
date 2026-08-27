const fs = require('fs');
const content = fs.readFileSync('src/components/StudentDashboard.tsx', 'utf8');
const toInsert = `        {/* ================= TAB 6: ACTIVITY FEED ================= */}
        {activeTab === 'activities' && (
          <div className="mt-8 space-y-6">
            <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase mb-4">Recent Activity Log</h2>
            <div className="glass-panel p-6 rounded-2xl border border-white/[0.05]">
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-neutral-medium text-xs font-mono">No recent activity detected.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map(act => (
                    <div key={act.id} className="flex gap-4 border-b border-white/[0.05] pb-4 last:border-0 last:pb-0 text-left">
                      <div className="mt-1">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse-slow"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-neutral-dark mb-1">{act.title}</p>
                        <p className="text-xs text-neutral-medium">{act.message}</p>
                        <p className="text-[9px] text-neutral-medium/60 mt-2 font-mono uppercase">
                          {new Date(act.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}\n      </div>\n`;

const target = `        {activeTab === 'analytics' && <Analytics /> }\n      </div>`;

fs.writeFileSync('src/components/StudentDashboard.tsx', content.replace(target, `        {activeTab === 'analytics' && <Analytics /> }\n${toInsert}`));
