const fs = require('fs');
let code = fs.readFileSync('src/app/(app)/teams/[id]/page.tsx', 'utf8');

// 1. Add SkillSelector import
code = code.replace('import TeamCard from "@/components/TeamCard";', 'import TeamCard from "@/components/TeamCard";\nimport { SkillSelector } from "@/components/SkillSelector";');

// 2. Add state variables
code = code.replace('const [selectedNewLeaderId, setSelectedNewLeaderId] = useState("");', 'const [selectedNewLeaderId, setSelectedNewLeaderId] = useState("");\n  const [applicantBio, setApplicantBio] = useState("");\n  const [applicantSkills, setApplicantSkills] = useState<string[]>([]);');

// 3. Initialize state from profile
code = code.replace('setCurrentUserProfile(data.profile);', 'setCurrentUserProfile(data.profile);\n        if (data.profile) {\n          setApplicantBio(data.profile.bio || "");\n          setApplicantSkills(data.profile.skills?.map((s: any) => s.skill) || []);\n        }');

// 4. Update handleRequestToJoin payload
code = code.replace('body: JSON.stringify({ team_id: team.id, direction: "user_to_team" }),', 'body: JSON.stringify({ team_id: team.id, direction: "user_to_team", applicantBio, applicantSkills }),');

// 5. Add UI elements before the button
const uiElements = `
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Your Bio / Description
            </label>
            <textarea
              value={applicantBio}
              onChange={(e) => setApplicantBio(e.target.value)}
              placeholder="Tell the team about yourself, why you'd be a good fit, etc..."
              rows={3}
              style={{
                border: "2px solid #1a1a1a",
                borderRadius: "4px",
                padding: "0.65rem 0.85rem",
                background: "#fdfbfa",
                color: "#1a1a1a",
                fontWeight: 500,
                fontSize: "0.95rem",
                width: "100%",
                boxSizing: "border-box",
                minHeight: "80px",
                outline: "none",
                resize: "vertical"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 800, color: "#1a1a1a", marginBottom: "0.4rem", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
              Your Skills
            </label>
            <SkillSelector selectedSkills={applicantSkills} onChange={setApplicantSkills} />
          </div>
        </div>
`;
code = code.split('<button \n          onClick={handleRequestToJoin}').join(uiElements + '\n        <button \n          onClick={handleRequestToJoin}');
code = code.split('<button \r\n          onClick={handleRequestToJoin}').join(uiElements + '\n        <button \n          onClick={handleRequestToJoin}');

fs.writeFileSync('src/app/(app)/teams/[id]/page.tsx', code);
