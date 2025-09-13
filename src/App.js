import React, { useState, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import "./App.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const App = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem("isAuthenticated") === "true"
  );
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem("currentUser") || "null")
  );
  const [teacherName, setTeacherName] = useState("");

  // Language state
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "fr"
  );

  // Application state
  const [ongletActif, setOngletActif] = useState("tableauBlanc");
  const [couleurTableau, setCouleurTableau] = useState("#ffffff");
  const [couleurStylo, setCouleurStylo] = useState("#000000");
  const [tailleStylo, setTailleStylo] = useState(5);
  const [diapositives, setDiapositives] = useState([
    {
      id: 1,
      titre: language === "fr" ? "Introduction" : "مقدمة",
      description:
        language === "fr" ? "Description de la diapositive" : "وصف الشريحة",
      contenu: "",
      duree: 10,
      objectifs: "",
      images: [],
    },
  ]);
  const [diapositiveCourante, setDiapositiveCourante] = useState(0);
  const [exercices, setExercices] = useState([
    { question: "", solution: "", difficulte: "moyen", points: 5 },
  ]);
  const [planHebdo, setPlanHebdo] = useState({
    Lundi: { matin: "", aprem: "" },
    Mardi: { matin: "", aprem: "" },
    Mercredi: { matin: "", aprem: "" },
    Jeudi: { matin: "", aprem: "" },
    Vendredi: { matin: "", aprem: "" },
    Samedi: { matin: "", aprem: "" },
  });

  // Quiz state
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      title: language === "fr" ? "Exemple de Quiz" : " مثال الاختبار",
      description:
        language === "fr"
          ? "Un quiz exemple avec des questions"
          : "اختبار نموذجي مع أسئلة",
      questions: [
        {
          id: 1,
          type: "multiple",
          questionText:
            language === "fr"
              ? "Quelle est la capitale de la France?"
              : "ما هي عاصمة فرنسا؟",
          image: null,
          options:
            language === "fr"
              ? ["Londres", "Berlin", "Paris", "Madrid"]
              : ["لندن", "برلين", "باريس", "مدريد"],
          correctAnswer: 2,
          points: 5,
          timeLimit: 30,
        },
      ],
    },
  ]);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Quiz player state
  const [quizEnCours, setQuizEnCours] = useState(null);
  const [questionActuelle, setQuestionActuelle] = useState(0);
  const [reponsesUtilisateur, setReponsesUtilisateur] = useState([]);
  const [tempsRestant, setTempsRestant] = useState(0);
  const [scoreQuiz, setScoreQuiz] = useState(0);
  const [quizTermine, setQuizTermine] = useState(false);

  // Absence state - Chargement depuis le localStorage
  const [groupes, setGroupes] = useState(() => {
    const savedGroupes = localStorage.getItem("groupes");
    return savedGroupes ? JSON.parse(savedGroupes) : [];
  });

  const [currentGroupe, setCurrentGroupe] = useState(null);

  const [dateAbsence, setDateAbsence] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [absences, setAbsences] = useState(() => {
    const savedAbsences = localStorage.getItem("absences");
    return savedAbsences ? JSON.parse(savedAbsences) : [];
  });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const quizImageInputRef = useRef(null);
  const [enDessin, setEnDessin] = useState(false);
  const [contexte, setContexte] = useState(null);

  // Traductions
  const translations = {
    fr: {
      // Login
      loginTitle: "Assistant Enseignant",
      namePlaceholder: "Entrez votre nom",
      startButton: "Commencer",
      loginNote: "Entrez votre nom pour accéder à l'application",

      // Header
      connectedAs: "Connecté en tant que:",
      logout: "Déconnexion",
      whiteboard: "Tableau Blanc",
      courseCreation: "Création de Cours",
      exercises: "Exercices",
      quiz: "Quiz",
      weeklyPlanning: "Planification Hebdo",
      attendance: "Présences",

      // Whiteboard
      boardColor: "Couleur du tableau:",
      penColor: "Couleur du stylo:",
      penSize: "Taille du stylo:",
      clearBoard: "Effacer le tableau",

      // Course creation
      addSlide: "+ Ajouter une diapositive",
      exportCourse: "Exporter le cours (PDF)",
      slideTitle: "Titre de la diapositive:",
      description: "Description:",
      objectives: "Objectifs d'apprentissage:",
      duration: "Durée (minutes):",
      content: "Contenu détaillé:",
      images: "Images:",
      addImage: "Ajouter une image",
      delete: "Supprimer",

      // Exercises
      createExercises: "Création d'Exercices",
      newExercise: "+ Nouvel exercice",
      exportExercises: "Exporter exercices (PDF)",
      exportSolutions: "Exporter solutions (PDF)",
      question: "Question:",
      solution: "Solution:",
      difficulty: "Difficulté:",
      points: "Points:",
      easy: "Facile",
      medium: "Moyen",
      hard: "Difficile",

      // Quiz
      createQuiz: "Création de Quiz",
      newQuiz: "+ Nouveau quiz",
      exportQuiz: "Exporter quiz (PDF)",
      quizTitle: "Titre du quiz:",
      questionType: "Type de question:",
      multipleChoice: "Choix multiple",
      textAnswer: "Réponse texte",
      answerOptions: "Options de réponse:",
      timeLimit: "Limite de temps (secondes):",
      startQuiz: "Démarrer ce quiz",
      deleteQuiz: "Supprimer le quiz",
      addQuestion: "+ Ajouter une question",
      quitQuiz: "Quitter le quiz",
      questionNumber: "Question",
      of: "sur",
      timeLeft: "Temps restant:",
      seconds: "secondes",
      submit: "Soumettre",
      quizFinished: "Quiz Terminé!",
      yourScore: "Votre score:",
      correctAnswers: "Réponses correctes:",
      answerReview: "Détail des réponses:",
      correctAnswer: "Réponse correcte:",
      noAnswer: "Aucune réponse",
      backToEditor: "Retour à l'éditeur de quiz",

      // Planning
      weeklyPlanning: "Planification Hebdomadaire",
      exportPlanning: "Exporter le planning (PDF)",
      morning: "Matin:",
      afternoon: "Après-midi:",

      // Attendance
      attendanceManagement: "Gestion des Présences",
      newGroup: "+ Nouveau groupe",
      exportExcel: "Exporter Excel",
      exportAttendance: "Exporter présences (PDF)",
      groups: "Groupes",
      noGroups:
        "Aucun groupe créé. Cliquez sur 'Nouveau groupe' pour commencer.",
      groupName: "Nom du groupe:",
      deleteGroup: "Supprimer le groupe",
      students: "Étudiants",
      addStudent: "+ Ajouter un étudiant",
      noStudents: "Aucun étudiant dans ce groupe.",
      present: "Présent",
      recordAttendance: "Enregistrer les présences",
      date: "Date:",
      studentList: "Liste des étudiants",
      recordForDate: "Enregistrer les présences pour cette date",
      attendanceHistory: "Historique des présences",
      noAttendance: "Aucune présence enregistrée.",
      group: "Groupe",
      absent: "Absent",
    },
    ar: {
      // Login
      loginTitle: "المساعد التعليمي",
      namePlaceholder: "أدخل اسمك",
      startButton: "ابدأ",
      loginNote: "أدخل اسمك للوصول إلى التطبيق",

      // Header
      connectedAs: "متصل باسم:",
      logout: "تسجيل الخروج",
      whiteboard: "اللوح الأبيض",
      courseCreation: "إنشاء الدروس",
      exercises: "تمارين",
      quiz: "اختبارات",
      weeklyPlanning: "التخطيط الأسبوعي",
      attendance: "الحضور",

      // Whiteboard
      boardColor: "لون اللوحة:",
      penColor: "لون القلم:",
      penSize: "حجم القلم:",
      clearBoard: "مسح اللوحة",

      // Course creation
      addSlide: "+ إضافة شريحة",
      exportCourse: "تصدير الدرس (PDF)",
      slideTitle: "عنوان الشريحة:",
      description: "الوصف:",
      objectives: "أهداف التعلم:",
      duration: "المدة (دقائق):",
      content: "المحتوى التفصيلي:",
      images: "الصور:",
      addImage: "إضافة صورة",
      delete: "حذف",

      // Exercises
      createExercises: "إنشاء التمارين",
      newExercise: "+ تمرين جديد",
      exportExercises: "تصدير التمارين (PDF)",
      exportSolutions: "تصدير الحلول (PDF)",
      question: "السؤال:",
      solution: "الحل:",
      difficulty: "الصعوبة:",
      points: "النقاط:",
      easy: "سهل",
      medium: "متوسط",
      hard: "صعب",

      // Quiz
      createQuiz: "إنشاء الاختبارات",
      newQuiz: "+ اختبار جديد",
      exportQuiz: "تصدير الاختبار (PDF)",
      quizTitle: "عنوان الاختبار:",
      questionType: "نوع السؤال:",
      multipleChoice: "اختيار متعدد",
      textAnswer: "إجابة نصية",
      answerOptions: "خيارات الإجابة:",
      timeLimit: "الحد الزمني (ثواني):",
      startQuiz: "بدء هذا الاختبار",
      deleteQuiz: "حذف الاختبار",
      addQuestion: "+ إضافة سؤال",
      quitQuiz: "خروج من الاختبار",
      questionNumber: "السؤال",
      of: "من",
      timeLeft: "الوقت المتبقي:",
      seconds: "ثانية",
      submit: "إرسال",
      quizFinished: "انتهى الاختبار!",
      yourScore: "نتيجتك:",
      correctAnswers: "الإجابات الصحيحة:",
      answerReview: "تفاصيل الإجابات:",
      correctAnswer: "الإجابة الصحيحة:",
      noAnswer: "لا توجد إجابة",
      backToEditor: "العودة إلى محرر الاختبارات",

      // Planning
      weeklyPlanning: "التخطيط الأسبوعي",
      exportPlanning: "تصدير الجدول (PDF)",
      morning: "الصباح:",
      afternoon: "بعد الظهر:",

      // Attendance
      attendanceManagement: "إدارة الحضور",
      newGroup: "+ مجموعة جديدة",
      exportExcel: "تصدير Excel",
      exportAttendance: "تصدير الحضور (PDF)",
      groups: "المجموعات",
      noGroups: "لا توجد مجموعات. انقر على 'مجموعة جديدة' للبدء.",
      groupName: "اسم المجموعة:",
      deleteGroup: "حذف المجموعة",
      students: "الطلاب",
      addStudent: "+ إضافة طالب",
      noStudents: "لا يوجد طلاب في هذه المجموعة.",
      present: "حاضر",
      recordAttendance: "تسجيل الحضور",
      date: "التاريخ:",
      studentList: "قائمة الطلاب",
      recordForDate: "تسجيل الحضور لهذا التاريخ",
      attendanceHistory: "سجل الحضور",
      noAttendance: "لا توجد سجلات حضور.",
      group: "المجموعة",
      absent: "غائب",
    },
  };

  // Charger les données depuis le localStorage
  useEffect(() => {
    const authStatus = localStorage.getItem("isAuthenticated");
    const userData = localStorage.getItem("currentUser");
    const savedLanguage = localStorage.getItem("language");

    if (authStatus === "true" && userData) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(userData));
    }

    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Sauvegarder la langue dans le localStorage
  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  // Sauvegarder les groupes dans le localStorage
  useEffect(() => {
    localStorage.setItem("groupes", JSON.stringify(groupes));
  }, [groupes]);

  // Sauvegarder les absences dans le localStorage
  useEffect(() => {
    localStorage.setItem("absences", JSON.stringify(absences));
  }, [absences]);

  // Gestion du timer pour le quiz
  useEffect(() => {
    let timer;
    if (quizEnCours && tempsRestant > 0) {
      timer = setInterval(() => {
        setTempsRestant((prev) => prev - 1);
      }, 1000);
    } else if (tempsRestant === 0 && quizEnCours) {
      handleReponse(null); // Passer à la question suivante quand le temps est écoulé
    }

    return () => clearInterval(timer);
  }, [quizEnCours, tempsRestant]);

  // Authentication functions - Simplified
  const handleLogin = (e) => {
    e.preventDefault();
    if (teacherName.trim()) {
      const user = {
        name: teacherName.trim(),
        role: "teacher",
      };

      setIsAuthenticated(true);
      setCurrentUser(user);
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      alert(
        language === "fr" ? "Veuillez entrer votre nom" : "يرجى إدخال اسمك"
      );
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTeacherName("");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
  };

  // Fonction pour convertir une image en Base64
  const convertirImageEnBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Initialiser le contexte du canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      setContexte(ctx);

      // Définir l'arrière-plan initial du canvas
      ctx.fillStyle = couleurTableau;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [couleurTableau]);

  const commencerDessin = (e) => {
    if (!contexte) return;

    const { offsetX, offsetY } = e.nativeEvent;
    contexte.beginPath();
    contexte.moveTo(offsetX, offsetY);
    setEnDessin(true);
  };

  const dessiner = (e) => {
    if (!enDessin || !contexte) return;

    const { offsetX, offsetY } = e.nativeEvent;
    contexte.lineTo(offsetX, offsetY);
    contexte.strokeStyle = couleurStylo;
    contexte.lineWidth = tailleStylo;
    contexte.lineCap = "round";
    contexte.stroke();
  };

  const arreterDessin = () => {
    if (!contexte) return;
    contexte.closePath();
    setEnDessin(false);
  };

  const effacerTableau = () => {
    if (!contexte) return;
    const canvas = canvasRef.current;
    contexte.fillStyle = couleurTableau;
    contexte.fillRect(0, 0, canvas.width, canvas.height);
  };

  const ajouterDiapositive = () => {
    const nouvelleDiapositive = {
      id: diapositives.length + 1,
      titre: `${language === "fr" ? "Diapositive" : "شريحة"} ${
        diapositives.length + 1
      }`,
      description:
        language === "fr" ? "Description de la diapositive" : "وصف الشريحة",
      contenu: "",
      duree: 10,
      objectifs: "",
      images: [],
    };
    setDiapositives([...diapositives, nouvelleDiapositive]);
    setDiapositiveCourante(diapositives.length);
  };

  const supprimerDiapositive = (index) => {
    if (diapositives.length <= 1) return;
    const nouvellesDiapositives = diapositives.filter((_, i) => i !== index);
    setDiapositives(nouvellesDiapositives);
    if (diapositiveCourante >= nouvellesDiapositives.length) {
      setDiapositiveCourante(nouvellesDiapositives.length - 1);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageBase64 = await convertirImageEnBase64(file);
      const nouvellesDiapositives = [...diapositives];

      if (!nouvellesDiapositives[diapositiveCourante].images) {
        nouvellesDiapositives[diapositiveCourante].images = [];
      }

      nouvellesDiapositives[diapositiveCourante].images.push({
        data: imageBase64,
        name: file.name,
        type: file.type,
      });

      setDiapositives(nouvellesDiapositives);
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image:", error);
      alert(
        language === "fr"
          ? "Erreur lors du téléchargement de l'image. Veuillez réessayer."
          : "حدث خطأ أثناء تحميل الصورة. يرجى المحاولة مرة أخرى."
      );
    }

    e.target.value = ""; // Réinitialiser l'input
  };

  const supprimerImage = (indexImage) => {
    const nouvellesDiapositives = [...diapositives];
    nouvellesDiapositives[diapositiveCourante].images.splice(indexImage, 1);
    setDiapositives(nouvellesDiapositives);
  };

  const ajouterExercice = () => {
    setExercices([
      ...exercices,
      { question: "", solution: "", difficulte: "moyen", points: 5 },
    ]);
  };

  const supprimerExercice = (index) => {
    if (exercices.length <= 1) return;
    const nouveauxExercices = exercices.filter((_, i) => i !== index);
    setExercices(nouveauxExercices);
  };

  // Quiz functions
  const ajouterQuiz = () => {
    const nouveauQuiz = {
      id: Date.now(),
      title: `${language === "fr" ? "Quiz" : "اختبار"} ${quizzes.length + 1}`,
      description: language === "fr" ? "Description du quiz" : "وصف الاختبار",
      questions: [
        {
          id: Date.now(),
          type: "multiple",
          questionText: language === "fr" ? "Nouvelle question" : "سؤال جديد",
          image: null,
          options:
            language === "fr"
              ? ["Option 1", "Option 2", "Option 3", "Option 4"]
              : ["الخيار 1", "الخيار 2", "الخيار 3", "الخيار 4"],
          correctAnswer: 0,
          points: 5,
          timeLimit: 30,
        },
      ],
    };
    setQuizzes([...quizzes, nouveauQuiz]);
    setCurrentQuiz(quizzes.length);
  };

  const supprimerQuiz = (index) => {
    if (quizzes.length <= 1) return;
    const nouveauxQuizzes = quizzes.filter((_, i) => i !== index);
    setQuizzes(nouveauxQuizzes);
    if (currentQuiz >= nouveauxQuizzes.length) {
      setCurrentQuiz(nouveauxQuizzes.length - 1);
    }
  };

  const ajouterQuestion = () => {
    const nouveauxQuizzes = [...quizzes];
    const nouvelleQuestion = {
      id: Date.now(),
      type: "multiple",
      questionText: language === "fr" ? "Nouvelle question" : "سؤال جديد",
      image: null,
      options:
        language === "fr"
          ? ["Option 1", "Option 2", "Option 3", "Option 4"]
          : ["الخيار 1", "الخيار 2", "الخيار 3", "الخيار 4"],
      correctAnswer: 0,
      points: 5,
      timeLimit: 30,
    };

    nouveauxQuizzes[currentQuiz].questions.push(nouvelleQuestion);
    setQuizzes(nouveauxQuizzes);
    setCurrentQuestion(nouveauxQuizzes[currentQuiz].questions.length - 1);
  };

  const supprimerQuestion = (index) => {
    const nouveauxQuizzes = [...quizzes];
    if (nouveauxQuizzes[currentQuiz].questions.length <= 1) return;

    nouveauxQuizzes[currentQuiz].questions.splice(index, 1);
    setQuizzes(nouveauxQuizzes);

    if (currentQuestion >= nouveauxQuizzes[currentQuiz].questions.length) {
      setCurrentQuestion(nouveauxQuizzes[currentQuiz].questions.length - 1);
    }
  };

  const exporterAbsencesExcel = () => {
    if (absences.length === 0) {
      alert(
        language === "fr"
          ? "Aucune absence enregistrée !"
          : "لا توجد سجلات غياب!"
      );
      return;
    }

    // Prepare data grouped by date and group
    const absencesParDateEtGroupe = {};
    absences.forEach((absence) => {
      if (!absencesParDateEtGroupe[absence.date]) {
        absencesParDateEtGroupe[absence.date] = {};
      }
      if (!absencesParDateEtGroupe[absence.date][absence.groupe]) {
        absencesParDateEtGroupe[absence.date][absence.groupe] = [];
      }
      absencesParDateEtGroupe[absence.date][absence.groupe].push(absence);
    });

    // Create a new workbook and worksheet data array
    const wb = XLSX.utils.book_new();

    // We'll create one sheet with all data grouped by date and group
    const wsData = [];

    // Header
    wsData.push([language === "fr" ? "Rapport de Présences" : "تقرير الحضور"]);
    wsData.push([
      `${language === "fr" ? "Enseignant" : "المعلم"}: ${currentUser.name}`,
    ]);
    wsData.push([]); // empty row

    // Loop through dates and groups to build rows
    Object.entries(absencesParDateEtGroupe).forEach(
      ([date, groupesParDate]) => {
        wsData.push([`${language === "fr" ? "Date" : "التاريخ"}: ${date}`]);

        Object.entries(groupesParDate).forEach(([groupe, absencesGroupe]) => {
          wsData.push([
            `${language === "fr" ? "Groupe" : "المجموعة"}: ${groupe}`,
          ]);
          wsData.push([
            language === "fr" ? "N°" : "م",
            language === "fr" ? "Nom" : "الاسم",
            language === "fr" ? "Statut" : "الحالة",
          ]); // Table header

          absencesGroupe.forEach((etudiant) => {
            const statut = etudiant.present
              ? language === "fr"
                ? "Présent"
                : "حاضر"
              : language === "fr"
              ? "Absent"
              : "غائب";
            wsData.push([etudiant.numero, etudiant.nom, statut]);
          });

          wsData.push([]); // empty row after each group
        });

        wsData.push([]); // empty row after each date
      }
    );

    // Convert array of arrays to worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Optionally, you can set column widths for better readability
    ws["!cols"] = [
      { wch: 5 }, // N°
      { wch: 30 }, // Nom
      { wch: 10 }, // Statut
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      language === "fr" ? "Présences" : "الحضور"
    );

    // Generate Excel file and trigger download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `presences_${currentUser.name.replace(/\s+/g, "_")}.xlsx`);
  };

  const handleQuizImageUpload = async (e, questionIndex) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const imageBase64 = await convertirImageEnBase64(file);
      const nouveauxQuizzes = [...quizzes];
      nouveauxQuizzes[currentQuiz].questions[questionIndex].image = {
        data: imageBase64,
        name: file.name,
        type: file.type,
      };

      setQuizzes(nouveauxQuizzes);
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image:", error);
      alert(
        language === "fr"
          ? "Erreur lors du téléchargement de l'image. Veuillez réessayer."
          : "حدث خطأ أثناء تحميل الصورة. يرجى المحاولة مرة أخرى."
      );
    }

    e.target.value = ""; // Réinitialiser l'input
  };

  const supprimerQuizImage = (questionIndex) => {
    const nouveauxQuizzes = [...quizzes];
    nouveauxQuizzes[currentQuiz].questions[questionIndex].image = null;
    setQuizzes(nouveauxQuizzes);
  };

  // Fonctions pour jouer au quiz
  const demarrerQuiz = (quizIndex) => {
    const quiz = quizzes[quizIndex];
    setQuizEnCours(quiz);
    setQuestionActuelle(0);
    setReponsesUtilisateur([]);
    setScoreQuiz(0);
    setQuizTermine(false);
    setTempsRestant(quiz.questions[0].timeLimit || 30);
  };

  const handleReponse = (reponseIndex) => {
    if (!quizEnCours) return;

    const nouvelleReponse = {
      questionId: quizEnCours.questions[questionActuelle].id,
      reponse: reponseIndex,
      estCorrecte:
        reponseIndex === quizEnCours.questions[questionActuelle].correctAnswer,
    };

    setReponsesUtilisateur([...reponsesUtilisateur, nouvelleReponse]);

    if (
      reponseIndex === quizEnCours.questions[questionActuelle].correctAnswer
    ) {
      setScoreQuiz(
        (prev) => prev + quizEnCours.questions[questionActuelle].points
      );
    }

    // Passer à la question suivante ou terminer le quiz
    if (questionActuelle < quizEnCours.questions.length - 1) {
      setQuestionActuelle(questionActuelle + 1);
      setTempsRestant(
        quizEnCours.questions[questionActuelle + 1].timeLimit || 30
      );
    } else {
      setQuizTermine(true);
    }
  };

  const quitterQuiz = () => {
    setQuizEnCours(null);
    setQuestionActuelle(0);
    setReponsesUtilisateur([]);
    setScoreQuiz(0);
    setQuizTermine(false);
    setTempsRestant(0);
  };

  // Absence functions
  const ajouterGroupe = () => {
    const nouveauGroupe = {
      id: Date.now(),
      nom: `${language === "fr" ? "Groupe" : "مجموعة"} ${groupes.length + 1}`,
      etudiants: [],
    };
    setGroupes([...groupes, nouveauGroupe]);
    setCurrentGroupe(nouveauGroupe);
  };

  const supprimerGroupe = (id) => {
    const nouveauxGroupes = groupes.filter((g) => g.id !== id);
    setGroupes(nouveauxGroupes);
    if (currentGroupe && currentGroupe.id === id) {
      setCurrentGroupe(nouveauxGroupes.length > 0 ? nouveauxGroupes[0] : null);
    }
  };

  const ajouterEtudiant = () => {
    if (!currentGroupe) return;

    const nouvelEtudiant = {
      id: Date.now(),
      nom: `${language === "fr" ? "Étudiant" : "طالب"} ${
        currentGroupe.etudiants.length + 1
      }`,
      numero: currentGroupe.etudiants.length + 1,
      present: true,
    };

    const nouveauxGroupes = groupes.map((g) =>
      g.id === currentGroupe.id
        ? { ...g, etudiants: [...g.etudiants, nouvelEtudiant] }
        : g
    );

    setGroupes(nouveauxGroupes);
    setCurrentGroupe(nouveauxGroupes.find((g) => g.id === currentGroupe.id));
  };

  const handlePresenceChange = (etudiantId, estPresent) => {
    if (!currentGroupe) return;

    const nouveauxGroupes = groupes.map((g) =>
      g.id === currentGroupe.id
        ? {
            ...g,
            etudiants: g.etudiants.map((e) =>
              e.id === etudiantId ? { ...e, present: estPresent } : e
            ),
          }
        : g
    );

    setGroupes(nouveauxGroupes);
    setCurrentGroupe(nouveauxGroupes.find((g) => g.id === currentGroupe.id));
  };

  const handleNomEtudiantChange = (etudiantId, nouveauNom) => {
    if (!currentGroupe) return;

    const nouveauxGroupes = groupes.map((g) =>
      g.id === currentGroupe.id
        ? {
            ...g,
            etudiants: g.etudiants.map((e) =>
              e.id === etudiantId ? { ...e, nom: nouveauNom } : e
            ),
          }
        : g
    );

    setGroupes(nouveauxGroupes);
    setCurrentGroupe(nouveauxGroupes.find((g) => g.id === currentGroupe.id));
  };

  const enregistrerAbsences = () => {
    if (!currentGroupe) return;

    const nouvellesAbsences = currentGroupe.etudiants.map((etudiant) => ({
      id: etudiant.id,
      nom: etudiant.nom,
      numero: etudiant.numero,
      present: etudiant.present,
      date: dateAbsence,
      groupe: currentGroupe.nom,
    }));

    setAbsences([...absences, ...nouvellesAbsences]);
    alert(
      `${
        language === "fr"
          ? "Présences enregistrées pour le"
          : "تم تسجيل الحضور ليوم"
      } ${dateAbsence}`
    );
  };

  const exporterAbsencesPDF = () => {
    if (absences.length === 0) {
      alert(
        language === "fr"
          ? "Aucune absence enregistrée !"
          : "لا توجد سجلات غياب!"
      );
      return;
    }

    const pdf = new jsPDF();

    // En-tête
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, 220, 30, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text(
      language === "fr" ? "Rapport de Présences" : "تقرير الحضور",
      105,
      12,
      { align: "center" }
    );
    pdf.setFontSize(12);
    pdf.text(
      `${language === "fr" ? "Enseignant" : "المعلم"}: ${currentUser.name}`,
      105,
      22,
      { align: "center" }
    );

    let yPosition = 45;

    // Grouper par date + groupe
    const absencesParDateEtGroupe = {};
    absences.forEach((absence) => {
      if (!absencesParDateEtGroupe[absence.date]) {
        absencesParDateEtGroupe[absence.date] = {};
      }
      if (!absencesParDateEtGroupe[absence.date][absence.groupe]) {
        absencesParDateEtGroupe[absence.date][absence.groupe] = [];
      }
      absencesParDateEtGroupe[absence.date][absence.groupe].push(absence);
    });

    // Boucle sur chaque date
    Object.entries(absencesParDateEtGroupe).forEach(
      ([date, groupesParDate]) => {
        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(
          `${language === "fr" ? "Date" : "التاريخ"}: ${date}`,
          15,
          yPosition
        );
        yPosition += 10;

        // Boucle sur chaque groupe
        Object.entries(groupesParDate).forEach(([groupe, absencesGroupe]) => {
          pdf.setFontSize(11);
          pdf.setTextColor(0, 0, 0);
          pdf.text(
            `${language === "fr" ? "Groupe" : "المجموعة"}: ${groupe}`,
            20,
            yPosition
          );
          yPosition += 7;

          absencesGroupe.forEach((etudiant) => {
            if (yPosition > 270) {
              pdf.addPage();
              yPosition = 20;

              pdf.setFillColor(41, 128, 185);
              pdf.rect(0, 0, 220, 10, "F");
              pdf.setTextColor(255, 255, 255);
              pdf.setFontSize(10);
              pdf.text(
                `${language === "fr" ? "Enseignant" : "المعلم"}: ${
                  currentUser.name
                }`,
                105,
                6,
                {
                  align: "center",
                }
              );
              pdf.setTextColor(0, 0, 0);
            }

            const statut = etudiant.present
              ? language === "fr"
                ? "Présent"
                : "حاضر"
              : language === "fr"
              ? "Absent"
              : "غائب";
            const couleur = etudiant.present ? [0, 128, 0] : [255, 0, 0];

            pdf.setFontSize(10);
            pdf.setTextColor(...couleur);
            pdf.text(
              `${etudiant.numero}. ${etudiant.nom} - ${statut}`,
              25,
              yPosition
            );
            yPosition += 7;
          });

          yPosition += 5;
        });

        yPosition += 10;
      }
    );

    pdf.save(`presences_${currentUser.name.replace(/\s+/g, "_")}.pdf`);
  };

  // Export functions with teacher name
  const exporterPDF = async (type) => {
    const pdf = new jsPDF();

    // En-tête avec style et nom de l'enseignant
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, 220, 30, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text("Assistant Enseignant", 105, 12, { align: "center" });

    // Add teacher name
    pdf.setFontSize(12);
    pdf.text(
      `${language === "fr" ? "Enseignant" : "المعلم"}: ${currentUser.name}`,
      105,
      22,
      { align: "center" }
    );

    pdf.setDrawColor(200, 200, 200);
    pdf.line(10, 35, 200, 35);

    if (type === "cours") {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text(language === "fr" ? "Plan de Cours" : "خطة الدرس", 105, 45, {
        align: "center",
      });

      let yPosition = 55;

      for (let i = 0; i < diapositives.length; i++) {
        const diapo = diapositives[i];

        // Vérifier si on doit ajouter une nouvelle page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;

          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(
            `${language === "fr" ? "Enseignant" : "المعلم"}: ${
              currentUser.name
            }`,
            105,
            6,
            {
              align: "center",
            }
          );
          pdf.setTextColor(0, 0, 0);
        }

        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(
          `${language === "fr" ? "Diapositive" : "شريحة"} ${i + 1}: ${
            diapo.titre
          }`,
          15,
          yPosition
        );

        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        yPosition += 7;
        pdf.text(
          `${language === "fr" ? "Description" : "الوصف"}: ${
            diapo.description
          }`,
          20,
          yPosition
        );

        yPosition += 5;
        pdf.text(
          `${language === "fr" ? "Durée" : "المدة"}: ${diapo.duree} ${
            language === "fr" ? "minutes" : "دقيقة"
          }`,
          20,
          yPosition
        );

        yPosition += 5;
        pdf.text(
          `${language === "fr" ? "Objectifs" : "الأهداف"}: ${diapo.objectifs}`,
          20,
          yPosition
        );

        yPosition += 5;

        // Ajouter le contenu avec gestion du texte long
        const contenuLines = pdf.splitTextToSize(
          `${language === "fr" ? "Contenu" : "المحتوى"}: ${diapo.contenu}`,
          170
        );
        pdf.text(contenuLines, 20, yPosition);
        yPosition += contenuLines.length * 5 + 5;

        // Ajouter les images si elles existent
        if (diapo.images && diapo.images.length > 0) {
          pdf.setTextColor(52, 152, 219);
          pdf.text(
            language === "fr" ? "Images incluses:" : "الصور المضمنة:",
            20,
            yPosition
          );
          yPosition += 7;

          for (let j = 0; j < diapo.images.length; j++) {
            const image = diapo.images[j];

            // Vérifier si on doit ajouter une nouvelle page pour l'image
            if (yPosition > 180) {
              pdf.addPage();
              yPosition = 20;

              // Add teacher name on each page
              pdf.setFillColor(41, 128, 185);
              pdf.rect(0, 0, 220, 10, "F");
              pdf.setTextColor(255, 255, 255);
              pdf.setFontSize(10);
              pdf.text(
                `${language === "fr" ? "Enseignant" : "المعلم"}: ${
                  currentUser.name
                }`,
                105,
                6,
                {
                  align: "center",
                }
              );
              pdf.setTextColor(0, 0, 0);
            }

            try {
              // Déterminer le format de l'image
              const format = image.type.includes("png") ? "PNG" : "JPEG";

              // Ajouter l'image au PDF (taille réduite pour s'adapter)
              pdf.addImage(image.data, format, 25, yPosition, 50, 50);
              pdf.setTextColor(100, 100, 100);
              pdf.setFontSize(8);
              pdf.text(
                `${language === "fr" ? "Image" : "صورة"}: ${image.name}`,
                80,
                yPosition + 25
              );

              yPosition += 60;
              pdf.setFontSize(10);
            } catch (error) {
              console.error("Erreur lors de l'ajout de l'image:", error);
              pdf.setTextColor(255, 0, 0);
              pdf.text(
                language === "fr"
                  ? "Erreur de chargement de l'image"
                  : "خطأ في تحميل الصورة",
                25,
                yPosition
              );
              yPosition += 10;
            }
          }
        }

        yPosition += 10;
        // Ligne séparatrice
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, 195, yPosition);
        yPosition += 15;
      }

      pdf.save(`plan_de_cours_${currentUser.name.replace(/\s+/g, "_")}.pdf`);
    } else if (type === "exercices") {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text(language === "fr" ? "Exercices" : "تمارين", 105, 45, {
        align: "center",
      });

      let yPosition = 55;

      exercices.forEach((exercice, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;

          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(
            `${language === "fr" ? "Enseignant" : "المعلم"}: ${
              currentUser.name
            }`,
            105,
            6,
            {
              align: "center",
            }
          );
          pdf.setTextColor(0, 0, 0);
        }

        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(
          `${language === "fr" ? "Exercice" : "تمرين"} ${index + 1} (${
            exercice.points
          } ${language === "fr" ? "points" : "نقطة"}) - ${
            language === "fr" ? "Difficulté" : "الصعوبة"
          }: ${
            language === "fr"
              ? exercice.difficulte
              : exercice.difficulte === "facile"
              ? "سهل"
              : exercice.difficulte === "moyen"
              ? "متوسط"
              : "صعب"
          }`,
          15,
          yPosition
        );

        yPosition += 7;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        // Gestion du texte long avec word wrap
        const questionLines = pdf.splitTextToSize(exercice.question, 180);
        pdf.text(questionLines, 20, yPosition);

        yPosition += questionLines.length * 5 + 5;

        // Ligne séparatrice
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, 195, yPosition);
        yPosition += 10;
      });

      pdf.save(`exercices_${currentUser.name.replace(/\s+/g, "_")}.pdf`);
    } else if (type === "solutions") {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text(
        language === "fr" ? "Solutions des Exercices" : "حلول التمارين",
        105,
        45,
        { align: "center" }
      );

      let yPosition = 55;

      exercices.forEach((exercice, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;

          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(
            `${language === "fr" ? "Enseignant" : "المعلم"}: ${
              currentUser.name
            }`,
            105,
            6,
            {
              align: "center",
            }
          );
          pdf.setTextColor(0, 0, 0);
        }

        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(
          `${language === "fr" ? "Exercice" : "تمرين"} ${index + 1}`,
          15,
          yPosition
        );

        yPosition += 7;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        // Question
        pdf.setFont(undefined, "bold");
        pdf.text(
          `${language === "fr" ? "Question" : "السؤال"}:`,
          20,
          yPosition
        );

        yPosition += 5;
        pdf.setFont(undefined, "normal");
        const questionLines = pdf.splitTextToSize(exercice.question, 180);
        pdf.text(questionLines, 25, yPosition);

        yPosition += questionLines.length * 5 + 5;

        // Solution
        pdf.setFont(undefined, "bold");
        pdf.text(`${language === "fr" ? "Solution" : "الحل"}:`, 20, yPosition);

        yPosition += 5;
        pdf.setFont(undefined, "normal");
        const solutionLines = pdf.splitTextToSize(exercice.solution, 180);
        pdf.text(solutionLines, 25, yPosition);

        yPosition += solutionLines.length * 5 + 10;

        // Ligne séparatrice
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, 195, yPosition);
        yPosition += 10;
      });

      pdf.save(`solutions_${currentUser.name.replace(/\s+/g, "_")}.pdf`);
    } else if (type === "planification") {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text(
        language === "fr" ? "Planning Hebdomadaire" : "التخطيط الأسبوعي",
        105,
        45,
        { align: "center" }
      );

      let yPosition = 55;

      Object.entries(planHebdo).forEach(([jour, activites], index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;

          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(
            `${language === "fr" ? "Enseignant" : "المعلم"}: ${
              currentUser.name
            }`,
            105,
            6,
            {
              align: "center",
            }
          );
          pdf.setTextColor(0, 0, 0);
        }

        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(jour, 15, yPosition);

        yPosition += 7;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        pdf.text(`${language === "fr" ? "Matin" : "الصباح"}:`, 20, yPosition);
        const matinLines = pdf.splitTextToSize(activites.matin, 170);
        pdf.text(matinLines, 30, yPosition);

        yPosition += matinLines.length * 5 + 5;

        pdf.text(
          `${language === "fr" ? "Après-midi" : "بعد الظهر"}:`,
          20,
          yPosition
        );
        const apremLines = pdf.splitTextToSize(activites.aprem, 170);
        pdf.text(apremLines, 35, yPosition);

        yPosition += apremLines.length * 5 + 10;

        // Ligne séparatrice
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, 195, yPosition);
        yPosition += 10;
      });

      pdf.save(
        `planning_hebdomadaire_${currentUser.name.replace(/\s+/g, "_")}.pdf`
      );
    } else if (type === "quiz") {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text(
        `${language === "fr" ? "Quiz" : "اختبار"}: ` +
          quizzes[currentQuiz].title,
        105,
        45,
        {
          align: "center",
        }
      );

      let yPosition = 55;

      quizzes[currentQuiz].questions.forEach((question, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;

          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(
            `${language === "fr" ? "Enseignant" : "المعلم"}: ${
              currentUser.name
            }`,
            105,
            6,
            {
              align: "center",
            }
          );
          pdf.setTextColor(0, 0, 0);
        }

        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(
          `${language === "fr" ? "Question" : "سؤال"} ${index + 1} (${
            question.points
          } ${language === "fr" ? "points" : "نقطة"}) - ${
            language === "fr" ? "Time" : "الوقت"
          }: ${question.timeLimit}s`,
          15,
          yPosition
        );

        yPosition += 7;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);

        // Question text
        const questionLines = pdf.splitTextToSize(question.questionText, 180);
        pdf.text(questionLines, 20, yPosition);
        yPosition += questionLines.length * 5 + 5;

        // Options
        question.options.forEach((option, optIndex) => {
          const prefix = optIndex === question.correctAnswer ? "✓ " : "○ ";
          pdf.text(prefix + option, 25, yPosition);
          yPosition += 5;
        });

        yPosition += 10;
        // Ligne séparatrice
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, 195, yPosition);
        yPosition += 15;
      });

      pdf.save(
        `quiz_${quizzes[currentQuiz].title.replace(
          /\s+/g,
          "_"
        )}_${currentUser.name.replace(/\s+/g, "_")}.pdf`
      );
    }
  };

  // Toggle language function
  const toggleLanguage = () => {
    const newLanguage = language === "fr" ? "ar" : "fr";
    setLanguage(newLanguage);
  };

  // Login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>{translations[language].loginTitle}</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>{language === "fr" ? "Votre nom" : "اسمك"}:</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder={translations[language].namePlaceholder}
                required
              />
            </div>
            <button type="submit">{translations[language].startButton}</button>
          </form>
          <p className="login-note">{translations[language].loginNote}</p>
        </div>
      </div>
    );
  }

  // Main application if authenticated
  return (
    <div className="app" dir={language === "ar" ? "rtl" : "ltr"}>
      <header className="app-header">
        <div className="header-user">
          <h1>Assistant Enseignant</h1>
          <h4>
            {language === "fr" ? "par" : "بواسطة"} <b>lasmar soufiane</b>
          </h4>
          <div className="user-info">
            <span>
              {translations[language].connectedAs} {currentUser.name}
            </span>
            <button onClick={handleLogout} className="logout-btn">
              {translations[language].logout}
            </button>
          
          </div>
        </div>
        <nav className="onglets">
          <button
            className={ongletActif === "tableauBlanc" ? "actif" : ""}
            onClick={() => setOngletActif("tableauBlanc")}
          >
            {translations[language].whiteboard}
          </button>
          <button
            className={ongletActif === "cours" ? "actif" : ""}
            onClick={() => setOngletActif("cours")}
          >
            {translations[language].courseCreation}
          </button>
          <button
            className={ongletActif === "exercices" ? "actif" : ""}
            onClick={() => setOngletActif("exercices")}
          >
            {translations[language].exercises}
          </button>
          <button
            className={ongletActif === "quiz" ? "actif" : ""}
            onClick={() => setOngletActif("quiz")}
          >
            {translations[language].quiz}
          </button>
          <button
            className={ongletActif === "planification" ? "actif" : ""}
            onClick={() => setOngletActif("planification")}
          >
            {translations[language].weeklyPlanning}
          </button>
          <button
            className={ongletActif === "absence" ? "actif" : ""}
            onClick={() => setOngletActif("absence")}
          >
            {translations[language].attendance}
          </button>
        </nav>
      </header>

      <main className="contenu-principal">
        {ongletActif === "tableauBlanc" && (
          <div className="tableau-blanc-container">
            <div className="controles-tableau">
              <label>
                {translations[language].boardColor}
                <input
                  type="color"
                  value={couleurTableau}
                  onChange={(e) => setCouleurTableau(e.target.value)}
                />
              </label>
              <label>
                {translations[language].penColor}
                <input
                  type="color"
                  value={couleurStylo}
                  onChange={(e) => setCouleurStylo(e.target.value)}
                />
              </label>
              <label>
                {translations[language].penSize}
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={tailleStylo}
                  onChange={(e) => setTailleStylo(parseInt(e.target.value))}
                />
                {tailleStylo}px
              </label>
              <button onClick={effacerTableau}>
                {translations[language].clearBoard}
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              className="canvas-tableau"
              onMouseDown={commencerDessin}
              onMouseMove={dessiner}
              onMouseUp={arreterDessin}
              onMouseLeave={arreterDessin}
            />
          </div>
        )}

        {ongletActif === "cours" && (
          <div className="creation-cours">
            <div className="controles-diapositives">
              <button onClick={ajouterDiapositive}>
                {translations[language].addSlide}
              </button>
              <button onClick={() => exporterPDF("cours")}>
                {translations[language].exportCourse}
              </button>
            </div>
            <div className="navigation-diapositives">
              {diapositives.map((diapo, index) => (
                <button
                  key={index}
                  className={diapositiveCourante === index ? "actif" : ""}
                  onClick={() => setDiapositiveCourante(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {diapositives.length > 0 && (
              <div className="editeur-diapositive">
                <div className="diapositive-header">
                  <h3>
                    {language === "fr" ? "Diapositive" : "شريحة"}{" "}
                    {diapositiveCourante + 1}
                  </h3>
                  <button
                    onClick={() => supprimerDiapositive(diapositiveCourante)}
                  >
                    {translations[language].delete}
                  </button>
                </div>

                <div className="form-group">
                  <label>{translations[language].slideTitle}</label>
                  <input
                    type="text"
                    value={diapositives[diapositiveCourante].titre}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].titre =
                        e.target.value;
                      setDiapositives(nouvellesDiapositives);
                    }}
                    placeholder={translations[language].slideTitle}
                  />
                </div>

                <div className="form-group">
                  <label>{translations[language].description}</label>
                  <input
                    type="text"
                    value={diapositives[diapositiveCourante].description}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].description =
                        e.target.value;
                      setDiapositives(nouvellesDiapositives);
                    }}
                    placeholder={translations[language].description}
                  />
                </div>

                <div className="form-group">
                  <label>{translations[language].objectives}</label>
                  <input
                    type="text"
                    value={diapositives[diapositiveCourante].objectifs}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].objectifs =
                        e.target.value;
                      setDiapositives(nouvellesDiapositives);
                    }}
                    placeholder={translations[language].objectives}
                  />
                </div>

                <div className="form-group">
                  <label>{translations[language].duration}</label>
                  <input
                    type="number"
                    min="1"
                    value={diapositives[diapositiveCourante].duree}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].duree =
                        parseInt(e.target.value);
                      setDiapositives(nouvellesDiapositives);
                    }}
                  />
                </div>

                <div className="form-group">
                  <label>{translations[language].content}</label>
                  <textarea
                    value={diapositives[diapositiveCourante].contenu}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].contenu =
                        e.target.value;
                      setDiapositives(nouvellesDiapositives);
                    }}
                    placeholder={translations[language].content}
                    rows="8"
                  />
                </div>

                <div className="form-group">
                  <label>{translations[language].images}</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: "none" }}
                  />
                  <button onClick={() => fileInputRef.current.click()}>
                    {translations[language].addImage}
                  </button>

                  <div className="images-container">
                    {diapositives[diapositiveCourante].images &&
                      diapositives[diapositiveCourante].images.map(
                        (image, index) => (
                          <div key={index} className="image-item">
                            <img src={image.data} alt="image" />
                            <span className="image-name">{image.name}</span>
                            <button onClick={() => supprimerImage(index)}>
                              ×
                            </button>
                          </div>
                        )
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {ongletActif === "exercices" && (
          <div className="creation-exercices">
            <h2>{translations[language].createExercises}</h2>
            <div className="controles-exercices">
              <button onClick={ajouterExercice}>
                {translations[language].newExercise}
              </button>
              <button onClick={() => exporterPDF("exercices")}>
                {translations[language].exportExercises}
              </button>
              <button onClick={() => exporterPDF("solutions")}>
                {translations[language].exportSolutions}
              </button>
            </div>

            <div className="liste-exercices">
              {exercices.map((exercice, index) => (
                <div key={index} className="exercice-item">
                  <div className="exercice-header">
                    <h3>
                      {translations[language].exercises} {index + 1}
                    </h3>
                    <button onClick={() => supprimerExercice(index)}>
                      {translations[language].delete}
                    </button>
                  </div>

                  <div className="form-group">
                    <label>{translations[language].question}</label>
                    <textarea
                      value={exercice.question}
                      onChange={(e) => {
                        const nouveauxExercices = [...exercices];
                        nouveauxExercices[index].question = e.target.value;
                        setExercices(nouveauxExercices);
                      }}
                      placeholder={translations[language].question}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>{translations[language].solution}</label>
                    <textarea
                      value={exercice.solution}
                      onChange={(e) => {
                        const nouveauxExercices = [...exercices];
                        nouveauxExercices[index].solution = e.target.value;
                        setExercices(nouveauxExercices);
                      }}
                      placeholder={translations[language].solution}
                      rows="3"
                    />
                  </div>

                  <div className="exercice-props">
                    <div className="form-group">
                      <label>{translations[language].difficulty}</label>
                      <select
                        value={exercice.difficulte}
                        onChange={(e) => {
                          const nouveauxExercices = [...exercices];
                          nouveauxExercices[index].difficulte = e.target.value;
                          setExercices(nouveauxExercices);
                        }}
                      >
                        <option value="facile">
                          {translations[language].easy}
                        </option>
                        <option value="moyen">
                          {translations[language].medium}
                        </option>
                        <option value="difficile">
                          {translations[language].hard}
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>{translations[language].points}</label>
                      <input
                        type="number"
                        min="1"
                        value={exercice.points}
                        onChange={(e) => {
                          const nouveauxExercices = [...exercices];
                          nouveauxExercices[index].points = parseInt(
                            e.target.value
                          );
                          setExercices(nouveauxExercices);
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ongletActif === "quiz" && !quizEnCours && (
          <div className="creation-quiz">
            <h2>{translations[language].createQuiz}</h2>
            <div className="controles-quiz">
              <button onClick={ajouterQuiz}>
                {translations[language].newQuiz}
              </button>
              <button onClick={() => exporterPDF("quiz")}>
                {translations[language].exportQuiz}
              </button>
            </div>

            <div className="navigation-quiz">
              {quizzes.map((quiz, index) => (
                <button
                  key={quiz.id}
                  className={currentQuiz === index ? "actif" : ""}
                  onClick={() => setCurrentQuiz(index)}
                >
                  {quiz.title}
                </button>
              ))}
            </div>

            {quizzes.length > 0 && (
              <div className="editeur-quiz">
                <div className="quiz-header">
                  <h3>{quizzes[currentQuiz].title}</h3>
                  <div>
                    <button
                      onClick={() => demarrerQuiz(currentQuiz)}
                      style={{ marginRight: "10px" }}
                    >
                      {translations[language].startQuiz}
                    </button>
                    <button onClick={() => supprimerQuiz(currentQuiz)}>
                      {translations[language].deleteQuiz}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>{translations[language].quizTitle}</label>
                  <input
                    type="text"
                    value={quizzes[currentQuiz].title}
                    onChange={(e) => {
                      const nouveauxQuizzes = [...quizzes];
                      nouveauxQuizzes[currentQuiz].title = e.target.value;
                      setQuizzes(nouveauxQuizzes);
                    }}
                    placeholder={translations[language].quizTitle}
                  />
                </div>

                <div className="form-group">
                  <label>{translations[language].description}</label>
                  <textarea
                    value={quizzes[currentQuiz].description}
                    onChange={(e) => {
                      const nouveauxQuizzes = [...quizzes];
                      nouveauxQuizzes[currentQuiz].description = e.target.value;
                      setQuizzes(nouveauxQuizzes);
                    }}
                    placeholder={translations[language].description}
                    rows="2"
                  />
                </div>

                <div className="questions-header">
                  <h4>{translations[language].question}</h4>
                  <button onClick={ajouterQuestion}>
                    {translations[language].addQuestion}
                  </button>
                </div>

                <div className="navigation-questions">
                  {quizzes[currentQuiz].questions.map((question, index) => (
                    <button
                      key={question.id}
                      className={currentQuestion === index ? "actif" : ""}
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                {quizzes[currentQuiz].questions.length > 0 && (
                  <div className="editeur-question">
                    <div className="question-header">
                      <h5>
                        {translations[language].question} {currentQuestion + 1}
                      </h5>
                      <button
                        onClick={() => supprimerQuestion(currentQuestion)}
                      >
                        {translations[language].delete}
                      </button>
                    </div>

                    <div className="form-group">
                      <label>{translations[language].questionType}</label>
                      <select
                        value={
                          quizzes[currentQuiz].questions[currentQuestion].type
                        }
                        onChange={(e) => {
                          const nouveauxQuizzes = [...quizzes];
                          nouveauxQuizzes[currentQuiz].questions[
                            currentQuestion
                          ].type = e.target.value;
                          setQuizzes(nouveauxQuizzes);
                        }}
                      >
                        <option value="multiple">
                          {translations[language].multipleChoice}
                        </option>
                        <option value="text">
                          {translations[language].textAnswer}
                        </option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>{translations[language].question}</label>
                      <textarea
                        value={
                          quizzes[currentQuiz].questions[currentQuestion]
                            .questionText
                        }
                        onChange={(e) => {
                          const nouveauxQuizzes = [...quizzes];
                          nouveauxQuizzes[currentQuiz].questions[
                            currentQuestion
                          ].questionText = e.target.value;
                          setQuizzes(nouveauxQuizzes);
                        }}
                        placeholder={translations[language].question}
                        rows="3"
                      />
                    </div>

                    {quizzes[currentQuiz].questions[currentQuestion].type ===
                      "multiple" && (
                      <>
                        <div className="form-group">
                          <label>{translations[language].answerOptions}</label>
                          {quizzes[currentQuiz].questions[
                            currentQuestion
                          ].options.map((option, optIndex) => (
                            <div key={optIndex} className="option-row">
                              <input
                                type="radio"
                                name={`correctAnswer-${currentQuestion}`}
                                checked={
                                  quizzes[currentQuiz].questions[
                                    currentQuestion
                                  ].correctAnswer === optIndex
                                }
                                onChange={() => {
                                  const nouveauxQuizzes = [...quizzes];
                                  nouveauxQuizzes[currentQuiz].questions[
                                    currentQuestion
                                  ].correctAnswer = optIndex;
                                  setQuizzes(nouveauxQuizzes);
                                }}
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const nouveauxQuizzes = [...quizzes];
                                  nouveauxQuizzes[currentQuiz].questions[
                                    currentQuestion
                                  ].options[optIndex] = e.target.value;
                                  setQuizzes(nouveauxQuizzes);
                                }}
                                placeholder={`${
                                  translations[language].answerOptions
                                } ${optIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="question-props">
                          <div className="form-group">
                            <label>{translations[language].points}</label>
                            <input
                              type="number"
                              min="1"
                              value={
                                quizzes[currentQuiz].questions[currentQuestion]
                                  .points
                              }
                              onChange={(e) => {
                                const nouveauxQuizzes = [...quizzes];
                                nouveauxQuizzes[currentQuiz].questions[
                                  currentQuestion
                                ].points = parseInt(e.target.value);
                                setQuizzes(nouveauxQuizzes);
                              }}
                            />
                          </div>

                          <div className="form-group">
                            <label>{translations[language].timeLimit}</label>
                            <input
                              type="number"
                              min="5"
                              value={
                                quizzes[currentQuiz].questions[currentQuestion]
                                  .timeLimit
                              }
                              onChange={(e) => {
                                const nouveauxQuizzes = [...quizzes];
                                nouveauxQuizzes[currentQuiz].questions[
                                  currentQuestion
                                ].timeLimit = parseInt(e.target.value);
                                setQuizzes(nouveauxQuizzes);
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {ongletActif === "quiz" && quizEnCours && (
          <div className="quiz-player">
            <div className="quiz-header">
              <h2>{quizEnCours.title}</h2>
              <button onClick={quitterQuiz}>
                {translations[language].quitQuiz}
              </button>
            </div>

            {!quizTermine ? (
              <div className="question-container">
                <div className="question-progress">
                  <p>
                    {translations[language].questionNumber}{" "}
                    {questionActuelle + 1} {translations[language].of}{" "}
                    {quizEnCours.questions.length}
                  </p>
                  <p>
                    {translations[language].timeLeft}: {tempsRestant}{" "}
                    {translations[language].seconds}
                  </p>
                </div>

                <div className="question-content">
                  <h3>
                    {quizEnCours.questions[questionActuelle].questionText}
                  </h3>

                  {quizEnCours.questions[questionActuelle].type ===
                    "multiple" && (
                    <div className="options-container">
                      {quizEnCours.questions[questionActuelle].options.map(
                        (option, index) => (
                          <button
                            key={index}
                            className="option-btn"
                            onClick={() => handleReponse(index)}
                          >
                            {option}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  {quizEnCours.questions[questionActuelle].type === "text" && (
                    <div className="text-answer-container">
                      <textarea
                        placeholder={translations[language].question}
                        rows="4"
                      ></textarea>
                      <button onClick={() => handleReponse(0)}>
                        {translations[language].submit}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="quiz-results">
                <h3>{translations[language].quizFinished}</h3>
                <p>
                  {translations[language].yourScore}: {scoreQuiz}{" "}
                  {translations[language].points}
                </p>
                <p>
                  {translations[language].correctAnswers}:{" "}
                  {reponsesUtilisateur.filter((r) => r.estCorrecte).length}{" "}
                  {translations[language].of} {quizEnCours.questions.length}
                </p>

                <div className="answers-review">
                  <h4>{translations[language].answerReview}</h4>
                  {quizEnCours.questions.map((question, index) => {
                    const userAnswer = reponsesUtilisateur.find(
                      (r) => r.questionId === question.id
                    );
                    return (
                      <div key={question.id} className="answer-item">
                        <p>
                          <strong>
                            {translations[language].question} {index + 1}:
                          </strong>{" "}
                          {question.questionText}
                        </p>
                        <p
                          className={
                            userAnswer && userAnswer.estCorrecte
                              ? "correct"
                              : "incorrect"
                          }
                        >
                          {userAnswer
                            ? `${translations[language].yourScore}: ${
                                question.type === "multiple"
                                  ? question.options[userAnswer.reponse]
                                  : translations[language].textAnswer
                              }`
                            : translations[language].noAnswer}
                        </p>
                        {question.type === "multiple" && (
                          <p>
                            {translations[language].correctAnswer}:{" "}
                            {question.options[question.correctAnswer]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button onClick={quitterQuiz}>
                  {translations[language].backToEditor}
                </button>
              </div>
            )}
          </div>
        )}

        {ongletActif === "planification" && (
          <div className="planification-hebdo">
            <h2>{translations[language].weeklyPlanning}</h2>
            <div className="controles-planification">
              <button onClick={() => exporterPDF("planification")}>
                {translations[language].exportPlanning}
              </button>
            </div>

            <div className="editeur-planning">
              {Object.entries(planHebdo).map(([jour, activites]) => (
                <div key={jour} className="jour-planning">
                  <h3>{jour}</h3>

                  <div className="form-group">
                    <label>{translations[language].morning}</label>
                    <textarea
                      value={activites.matin}
                      onChange={(e) => {
                        setPlanHebdo({
                          ...planHebdo,
                          [jour]: { ...activites, matin: e.target.value },
                        });
                      }}
                      placeholder={translations[language].morning}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>{translations[language].afternoon}</label>
                    <textarea
                      value={activites.aprem}
                      onChange={(e) => {
                        setPlanHebdo({
                          ...planHebdo,
                          [jour]: { ...activites, aprem: e.target.value },
                        });
                      }}
                      placeholder={translations[language].afternoon}
                      rows="3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ongletActif === "absence" && (
          <div className="gestion-absence">
            <h2>{translations[language].attendanceManagement}</h2>

            <div className="controles-absence">
              <button onClick={ajouterGroupe}>
                {translations[language].newGroup}
              </button>
              <button onClick={exporterAbsencesExcel}>
                {translations[language].exportExcel}
              </button>
              <button onClick={exporterAbsencesPDF}>
                {translations[language].exportAttendance}
              </button>
            </div>

            <div className="groupes-list">
              <h3>{translations[language].groups}</h3>
              {groupes.length === 0 ? (
                <p>{translations[language].noGroups}</p>
              ) : (
                <div className="groupes-buttons">
                  {groupes.map((groupe) => (
                    <button
                      key={groupe.id}
                      className={
                        currentGroupe && currentGroupe.id === groupe.id
                          ? "actif"
                          : "actif"
                      }
                      onClick={() => setCurrentGroupe(groupe)}
                    >
                      {groupe.nom}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {currentGroupe && (
              <div className="groupe-editeur">
                <div className="groupe-header">
                  <h3>{currentGroupe.nom}</h3>
                  <button onClick={() => supprimerGroupe(currentGroupe.id)}>
                    {translations[language].deleteGroup}
                  </button>
                </div>

                <div className="form-group">
                  <label>{translations[language].groupName}</label>
                  <input
                    type="text"
                    value={currentGroupe.nom}
                    onChange={(e) => {
                      const nouveauxGroupes = groupes.map((g) =>
                        g.id === currentGroupe.id
                          ? { ...g, nom: e.target.value }
                          : g
                      );
                      setGroupes(nouveauxGroupes);
                      setCurrentGroupe(
                        nouveauxGroupes.find((g) => g.id === currentGroupe.id)
                      );
                    }}
                  />
                </div>

                <div className="etudiants-list">
                  <h4>{translations[language].students}</h4>
                  <button onClick={ajouterEtudiant}>
                    {translations[language].addStudent}
                  </button>

                  {currentGroupe.etudiants.length === 0 ? (
                    <p>{translations[language].noStudents}</p>
                  ) : (
                    <div className="liste-etudiants">
                      {currentGroupe.etudiants.map((etudiant) => (
                        <div key={etudiant.id} className="etudiant-item">
                          <div className="etudiant-info">
                            <span className="etudiant-numero">
                              {etudiant.numero}.
                            </span>
                            <input
                              type="text"
                              value={etudiant.nom}
                              onChange={(e) =>
                                handleNomEtudiantChange(
                                  etudiant.id,
                                  e.target.value
                                )
                              }
                              className="etudiant-nom"
                            />
                          </div>
                          <label className="presence-label">
                            <input
                              type="checkbox"
                              checked={etudiant.present}
                              onChange={(e) =>
                                handlePresenceChange(
                                  etudiant.id,
                                  e.target.checked
                                )
                              }
                            />
                            {translations[language].present}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="enregistrement-absence">
                  <h4>{translations[language].recordAttendance}</h4>
                  <div className="form-group">
                    <label>{translations[language].date}</label>
                    <input
                      type="date"
                      value={dateAbsence}
                      onChange={(e) => setDateAbsence(e.target.value)}
                    />
                  </div>

                  <div className="liste-presence">
                    <h4>
                      {translations[language].studentList} - {dateAbsence}
                    </h4>
                    {currentGroupe.etudiants.map((etudiant) => (
                      <div key={etudiant.id} className="ligne-presence">
                        <span className="etudiant-info">
                          {etudiant.numero}. {etudiant.nom}
                        </span>
                        <label className="switch-presence">
                          <input
                            type="checkbox"
                            checked={etudiant.present}
                            onChange={(e) =>
                              handlePresenceChange(
                                etudiant.id,
                                e.target.checked
                              )
                            }
                          />
                          <span className="slider">
                            {etudiant.present
                              ? translations[language].present
                              : translations[language].absent}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>

                  <button onClick={enregistrerAbsences}>
                    {translations[language].recordForDate}
                  </button>
                </div>
              </div>
            )}

            <div className="historique-absences">
              <h3>{translations[language].attendanceHistory}</h3>
              {absences.length === 0 ? (
                <p>{translations[language].noAttendance}</p>
              ) : (
                <div className="liste-absences">
                  {absences.map((absence) => (
                    <div key={absence.id} className="absence-item">
                      <h4>
                        {absence.groupe} - {absence.date}
                      </h4>
                      <ul>
                        {absence.etudiantsAbsents &&
                          absence.etudiantsAbsents.map((etudiant, index) => (
                            <li key={index}>{etudiant}</li>
                          ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
