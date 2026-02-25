const fs = require('fs');
const path = require('path');

const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (let file of files) {
  let filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Replace the inline fetch block found in Dashboard, Attendance, Departments, Employees
  const pattern1 = /\/\/ Try logging in as admin[\s\S]*?token = resReg\.data\.data\.token;\s*\}/g;
  content = content.replace(pattern1, "let token = localStorage.getItem('ravi_zoho_token');\n                if (!token) { window.location.reload(); return; }");

  // Replace getToken block in Leave, Payroll
  const pattern2 = /const getToken = async \(\) => \{[\s\S]*?return token;\s*\};/g;
  content = content.replace(pattern2, `const getToken = async () => {
        let token = localStorage.getItem('ravi_zoho_token');
        if (!token) { window.location.reload(); throw new Error("No token"); }
        return token;
    };`);

  // Another variation in some pages:
  const pattern3 = /\/\/ Try login[\s\S]*?token = resReg\.data\.data\.token;\s*\}/g;
  content = content.replace(pattern3, "let token = localStorage.getItem('ravi_zoho_token');\n                if (!token) { window.location.reload(); return; }");

  // Replace variation in LeavePage if it didn't match pattern1
  const pattern4 = /\/\/ Get token[\s\S]*?token = resReg\.data\.data\.token;\s*\}/g;
  content = content.replace(pattern4, "let token = localStorage.getItem('ravi_zoho_token');\n                if (!token) { window.location.reload(); return; }");

  fs.writeFileSync(filepath, content);
}
console.log("Refactored auth blocks");
