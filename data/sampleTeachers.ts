// // @/data/sampleTeachers.ts
// export const sampleTeachers = [
//     {
//       name: "Anjali Sharma",
//       email: "anjali.cbse5eng@example.com",
//       board: "CBSE (Central Board of Secondary Education)",
//       teachingClass: "Class 5",
//       subject: "English",
//       language: "English",
//       profilePic: "https://randomuser.me/api/portraits/women/1.jpg",
//       charge: 500,
//       description: "Experienced English teacher with a love for creative writing.",
//     },
//     {
//       name: "Ravi Kumar",
//       email: "ravi.cbse10sci@example.com",
//       board: "CBSE (Central Board of Secondary Education)",
//       teachingClass: "Class 10",
//       subject: "Science",
//       language: "Hindi",
//       profilePic: "https://randomuser.me/api/portraits/men/2.jpg",
//       charge: 600,
//       description: "10 years experience teaching high school science in Hindi medium.",
//     },
//     {
//       name: "Sundar Iyer",
//       email: "sundar.tn12phy@example.com",
//       board: "State Board (Tamil Nadu)",
//       teachingClass: "Class 12",
//       subject: "Physics",
//       language: "Tamil",
//       profilePic: "https://randomuser.me/api/portraits/men/3.jpg",
//       charge: 800,
//       description: "Physics tutor with expertise in NEET preparation.",
//     },
//     {
//       name: "Fatima Sheikh",
//       email: "fatima.icse6math@example.com",
//       board: "ICSE (Indian Certificate of Secondary Education)",
//       teachingClass: "Class 6",
//       subject: "Mathematics",
//       language: "English",
//       profilePic: "https://randomuser.me/api/portraits/women/4.jpg",
//       charge: 550,
//       description: "Passionate about numbers and ICSE math curriculum.",
//     },
//     {
//       name: "Meera Rao",
//       email: "meera.maha8hindi@example.com",
//       board: "State Board (Maharashtra)",
//       teachingClass: "Class 8",
//       subject: "Hindi",
//       language: "Marathi",
//       profilePic: "https://randomuser.me/api/portraits/women/5.jpg",
//       charge: 450,
//       description: "Skilled in bilingual teaching and literature.",
//     },
//     {
//       name: "Arjun Das",
//       email: "arjun.kar9geo@example.com",
//       board: "State Board (Karnataka)",
//       teachingClass: "Class 9",
//       subject: "Geography",
//       language: "Kannada",
//       profilePic: "https://randomuser.me/api/portraits/men/6.jpg",
//       charge: 520,
//       description: "Dedicated to teaching through visuals and maps.",
//     },
//     {
//       name: "Neha Patil",
//       email: "neha.ibdpbio@example.com",
//       board: "International Baccalaureate (IB)",
//       teachingClass: "DP (Diploma Programme)",
//       subject: "Biology",
//       language: "English",
//       profilePic: "https://randomuser.me/api/portraits/women/7.jpg",
//       charge: 1000,
//       description: "IB trained biology expert with lab specialization.",
//     },
//     {
//       name: "Vikram Mehta",
//       email: "vikram.igcsea@example.com",
//       board: "Cambridge (IGCSE)",
//       teachingClass: "IGCSE (Class 10)",
//       subject: "Economics",
//       language: "English",
//       profilePic: "https://randomuser.me/api/portraits/men/8.jpg",
//       charge: 900,
//       description: "Cambridge-certified economics tutor with 8+ years experience.",
//     },
//     {
//       name: "Kavitha R",
//       email: "kavitha.ap6comp@example.com",
//       board: "State Board (Andhra Pradesh)",
//       teachingClass: "Class 6",
//       subject: "Computer Science",
//       language: "Telugu",
//       profilePic: "https://randomuser.me/api/portraits/women/9.jpg",
//       charge: 480,
//       description: "Fun coding sessions for early learners in Telugu.",
//     },
//     {
//       name: "Mohammed Azhar",
//       email: "azhar.cbse12math@example.com",
//       board: "CBSE (Central Board of Secondary Education)",
//       teachingClass: "Class 12 (Science)",
//       subject: "Mathematics",
//       language: "English",
//       profilePic: "https://randomuser.me/api/portraits/men/10.jpg",
//       charge: 700,
//       description: "Specializes in board prep & competitive exams.",
//     },
//   ];
import { BASE_URL } from "../config";

export async function getTeacherCountByBoardAPI() {
  const res = await fetch(
    `https://${BASE_URL}/api/teachers/count-by-board`
  );
  return await res.json(); // { "CBSE": 3, "ICSE": 2, ... }
}
export async function getClassesByBoardAPI(board: string | number | boolean) {
  const res = await fetch(
    `https://${BASE_URL}/api/teachers/classes?board=${encodeURIComponent(
      board
    )}`
  );
  return await res.json(); // [ "Class 5", "Class 10", "Class 12" ]
}
export async function getTeachersAPI(board: any, className: any, subject: string) {
  const query = new URLSearchParams({ board, class: className });
  if (subject) query.append("subject", subject);

  const res = await fetch(
    `https://${BASE_URL}/api/teachers?${query.toString()}`
  );
  return await res.json(); // array of teacher objects
}
