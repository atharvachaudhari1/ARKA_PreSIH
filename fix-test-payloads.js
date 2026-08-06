const fs = require('fs');

function fixTeams() {
  const file = 'src/__tests__/api/teams.test.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/body: JSON\.stringify\(\{\s*name: "New Team"\s*\}\)/g, 'body: JSON.stringify({ name: "New Team", description: "Team description" })');
  content = content.replace(/body: JSON\.stringify\(\{\s*name: "Error Team"\s*\}\)/g, 'body: JSON.stringify({ name: "Error Team", description: "Team description" })');
  fs.writeFileSync(file, content);
}

function fixJoinRequests() {
  const file = 'src/__tests__/api/join-requests.test.ts';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/body: JSON\.stringify\(\{ team_id: "team1", direction: "user_to_team" \}\)/g, 'body: JSON.stringify({ team_id: "team1", direction: "user_to_team", applicantBio: "Test bio" })');
  fs.writeFileSync(file, content);
}

fixTeams();
fixJoinRequests();
