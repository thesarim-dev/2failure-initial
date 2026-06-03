export const manifest = {
  screens: {
    scr_1cihbc: { name: "Home", route: "/", position: { "x": 160, "y": 220 } },
    scr_a9jyql: { name: "Store", route: "/", state: { "appState": "STORE" }, position: { "x": 160, "y": 2200 } },
    scr_g6kubg: { name: "Workout", route: "/", state: { "appState": "WORKOUT", "currentMoveId": "pushups" }, position: { "x": 1560, "y": 220 } },
    scr_xlidkr: { name: "Summary", route: "/", state: { "appState": "SUMMARY", "currentMoveId": "pushups", "lastDuration": 47 }, position: { "x": 2960, "y": 220 } }
  },
  sections: {
    sec_zczmn6: { name: "Workout Flow", x: 0, y: 0, width: 4320, height: 1180 },
    sec_kstfqy: { name: "Store Flow", x: 0, y: 1980, width: 1520, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_zczmn6", children: [
    { kind: "screen", id: "scr_1cihbc" },
    { kind: "screen", id: "scr_g6kubg" },
    { kind: "screen", id: "scr_xlidkr" }]
  },
  { kind: "section", id: "sec_kstfqy", children: [
    { kind: "screen", id: "scr_a9jyql" }]
  }]

};