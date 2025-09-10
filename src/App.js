               
              import React, { useState, useRef, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import './App.css';

const App = () => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('currentUser') || 'null')
  );
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // User accounts
  const [userAccounts] = useState([
    { id: 1, username: 'Mahdi', password: 'Mahdi@2025', name: 'Mahdi tahiri', role: 'teacher' },
    { id: 1, username: 'zakia', password: 'zakia@2025', name: 'lasmar zakia', role: 'teacher' },
    { id: 1, username: 'fatima', password: 'fatima@2025', name: 'fatima boulkomit', role: 'teacher' },
    
  ]);

  // Application state
  const [ongletActif, setOngletActif] = useState('tableauBlanc');
  const [couleurTableau, setCouleurTableau] = useState('#ffffff');
  const [couleurStylo, setCouleurStylo] = useState('#000000');
  const [tailleStylo, setTailleStylo] = useState(5);
  const [diapositives, setDiapositives] = useState([
    { 
      id: 1, 
      titre: 'Introduction', 
      description: 'Description de la diapositive',
      contenu: '',
      duree: 10,
      objectifs: '',
      images: []
    }
  ]);
  const [diapositiveCourante, setDiapositiveCourante] = useState(0);
  const [exercices, setExercices] = useState([{ question: '', solution: '', difficulte: 'moyen', points: 5 }]);
  const [planHebdo, setPlanHebdo] = useState({
    Lundi: { matin: '', aprem: '' }, 
    Mardi: { matin: '', aprem: '' }, 
    Mercredi: { matin: '', aprem: '' }, 
    Jeudi: { matin: '', aprem: '' }, 
    Vendredi: { matin: '', aprem: '' }
  });

  // Quiz state
  const [quizzes, setQuizzes] = useState([
    {
      id: 1,
      title: 'Exemple de Quiz',
      description: 'Un quiz exemple avec des questions',
      questions: [
        {
          id: 1,
          type: 'multiple',
          questionText: 'Quelle est la capitale de la France?',
          image: null,
          options: ['Londres', 'Berlin', 'Paris', 'Madrid'],
          correctAnswer: 2,
          points: 5,
          timeLimit: 30
        }
      ]
    }
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
    const savedGroupes = localStorage.getItem('groupes');
    return savedGroupes ? JSON.parse(savedGroupes) : [];
  });
  
  const [currentGroupe, setCurrentGroupe] = useState(null);
  
  const [dateAbsence, setDateAbsence] = useState(new Date().toISOString().split('T')[0]);
  
  const [absences, setAbsences] = useState(() => {
    const savedAbsences = localStorage.getItem('absences');
    return savedAbsences ? JSON.parse(savedAbsences) : [];
  });

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const quizImageInputRef = useRef(null);
  const [enDessin, setEnDessin] = useState(false);
  const [contexte, setContexte] = useState(null);

  // Charger les données depuis le localStorage
  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    const userData = localStorage.getItem('currentUser');
    
    if (authStatus === 'true' && userData) {
      setIsAuthenticated(true);
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Sauvegarder les groupes dans le localStorage
  useEffect(() => {
    localStorage.setItem('groupes', JSON.stringify(groupes));
  }, [groupes]);

  // Sauvegarder les absences dans le localStorage
  useEffect(() => {
    localStorage.setItem('absences', JSON.stringify(absences));
  }, [absences]);

  // Gestion du timer pour le quiz
  useEffect(() => {
    let timer;
    if (quizEnCours && tempsRestant > 0) {
      timer = setInterval(() => {
        setTempsRestant(prev => prev - 1);
      }, 1000);
    } else if (tempsRestant === 0 && quizEnCours) {
      handleReponse(null); // Passer à la question suivante quand le temps est écoulé
    }
    
    return () => clearInterval(timer);
  }, [quizEnCours, tempsRestant]);

  // Authentication functions
  const handleLogin = (e) => {
    e.preventDefault();
    const user = userAccounts.find(
      acc => acc.username === loginForm.username && acc.password === loginForm.password
    );
    
    if (user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      alert('Nom d\'utilisateur ou mot de passe incorrect');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
  };

  // Fonction pour convertir une image en Base64
  const convertirImageEnBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Initialiser le contexte du canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
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
    contexte.lineCap = 'round';
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
      titre: `Diapositive ${diapositives.length + 1}`,
      description: 'Description de la diapositive',
      contenu: '',
      duree: 10,
      objectifs: '',
      images: []
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
        type: file.type
      });
      
      setDiapositives(nouvellesDiapositives);
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image:", error);
      alert("Erreur lors du téléchargement de l'image. Veuillez réessayer.");
    }
    
    e.target.value = ''; // Réinitialiser l'input
  };

  const supprimerImage = (indexImage) => {
    const nouvellesDiapositives = [...diapositives];
    nouvellesDiapositives[diapositiveCourante].images.splice(indexImage, 1);
    setDiapositives(nouvellesDiapositives);
  };

  const ajouterExercice = () => {
    setExercices([...exercices, { question: '', solution: '', difficulte: 'moyen', points: 5 }]);
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
      title: `Quiz ${quizzes.length + 1}`,
      description: 'Description du quiz',
      questions: [
        {
          id: Date.now(),
          type: 'multiple',
          questionText: 'Nouvelle question',
          image: null,
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: 0,
          points: 5,
          timeLimit: 30
        }
      ]
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
      type: 'multiple',
      questionText: 'Nouvelle question',
      image: null,
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 0,
      points: 5,
      timeLimit: 30
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

  const handleQuizImageUpload = async (e, questionIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const imageBase64 = await convertirImageEnBase64(file);
      const nouveauxQuizzes = [...quizzes];
      nouveauxQuizzes[currentQuiz].questions[questionIndex].image = {
        data: imageBase64,
        name: file.name,
        type: file.type
      };
      
      setQuizzes(nouveauxQuizzes);
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image:", error);
      alert("Erreur lors du téléchargement de l'image. Veuillez réessayer.");
    }
    
    e.target.value = ''; // Réinitialiser l'input
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
      estCorrecte: reponseIndex === quizEnCours.questions[questionActuelle].correctAnswer
    };
    
    setReponsesUtilisateur([...reponsesUtilisateur, nouvelleReponse]);
    
    if (reponseIndex === quizEnCours.questions[questionActuelle].correctAnswer) {
      setScoreQuiz(prev => prev + quizEnCours.questions[questionActuelle].points);
    }
    
    // Passer à la question suivante ou terminer le quiz
    if (questionActuelle < quizEnCours.questions.length - 1) {
      setQuestionActuelle(questionActuelle + 1);
      setTempsRestant(quizEnCours.questions[questionActuelle + 1].timeLimit || 30);
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
      nom: `Groupe ${groupes.length + 1}`,
      etudiants: []
    };
    setGroupes([...groupes, nouveauGroupe]);
    setCurrentGroupe(nouveauGroupe);
  };

  const supprimerGroupe = (id) => {
    const nouveauxGroupes = groupes.filter(g => g.id !== id);
    setGroupes(nouveauxGroupes);
    if (currentGroupe && currentGroupe.id === id) {
      setCurrentGroupe(nouveauxGroupes.length > 0 ? nouveauxGroupes[0] : null);
    }
  };

  const ajouterEtudiant = () => {
    if (!currentGroupe) return;
    
    const nouvelEtudiant = {
      id: Date.now(),
      nom: `Étudiant ${currentGroupe.etudiants.length + 1}`,
      numero: currentGroupe.etudiants.length + 1,
      present: true
    };
    
    const nouveauxGroupes = groupes.map(g => 
      g.id === currentGroupe.id 
        ? { ...g, etudiants: [...g.etudiants, nouvelEtudiant] }
        : g
    );
    
    setGroupes(nouveauxGroupes);
    setCurrentGroupe(nouveauxGroupes.find(g => g.id === currentGroupe.id));
  };

  const handlePresenceChange = (etudiantId, estPresent) => {
    if (!currentGroupe) return;
    
    const nouveauxGroupes = groupes.map(g => 
      g.id === currentGroupe.id 
        ? { 
            ...g, 
            etudiants: g.etudiants.map(e => 
              e.id === etudiantId ? { ...e, present: estPresent } : e
            )
          }
        : g
    );
    
    setGroupes(nouveauxGroupes);
    setCurrentGroupe(nouveauxGroupes.find(g => g.id === currentGroupe.id));
  };

  const handleNomEtudiantChange = (etudiantId, nouveauNom) => {
    if (!currentGroupe) return;
    
    const nouveauxGroupes = groupes.map(g => 
      g.id === currentGroupe.id 
        ? { 
            ...g, 
            etudiants: g.etudiants.map(e => 
              e.id === etudiantId ? { ...e, nom: nouveauNom } : e
            )
          }
        : g
    );
    
    setGroupes(nouveauxGroupes);
    setCurrentGroupe(nouveauxGroupes.find(g => g.id === currentGroupe.id));
  };

  const enregistrerAbsences = () => {
    if (!currentGroupe) return;
    
    const nouvellesAbsences = currentGroupe.etudiants.map(etudiant => ({
      id: etudiant.id,
      nom: etudiant.nom,
      numero: etudiant.numero,
      present: etudiant.present,
      date: dateAbsence,
      groupe: currentGroupe.nom
    }));
    
    setAbsences([...absences, ...nouvellesAbsences]);
    alert(`Présences enregistrées pour le ${dateAbsence}`);
  };

 const exporterAbsencesPDF = () => {
  if (absences.length === 0) {
    alert("Aucune absence enregistrée !");
    return;
  }

  const pdf = new jsPDF();

  // En-tête
  pdf.setFillColor(41, 128, 185);
  pdf.rect(0, 0, 220, 30, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text('Rapport de Présences', 105, 12, { align: 'center' });
  pdf.setFontSize(12);
  pdf.text(`Enseignant: ${currentUser.name}`, 105, 22, { align: 'center' });

  let yPosition = 45;

  // Grouper par date + groupe
  const absencesParDateEtGroupe = {};
  absences.forEach(absence => {
    if (!absencesParDateEtGroupe[absence.date]) {
      absencesParDateEtGroupe[absence.date] = {};
    }
    if (!absencesParDateEtGroupe[absence.date][absence.groupe]) {
      absencesParDateEtGroupe[absence.date][absence.groupe] = [];
    }
    absencesParDateEtGroupe[absence.date][absence.groupe].push(absence);
  });

  // Boucle sur chaque date
  Object.entries(absencesParDateEtGroupe).forEach(([date, groupesParDate]) => {
    pdf.setFontSize(12);
    pdf.setTextColor(52, 152, 219);
    pdf.text(`Date: ${date}`, 15, yPosition);
    yPosition += 10;

    // Boucle sur chaque groupe
    Object.entries(groupesParDate).forEach(([groupe, absencesGroupe]) => {
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Groupe: ${groupe}`, 20, yPosition);
      yPosition += 7;

      absencesGroupe.forEach(etudiant => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;

          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(`Enseignant: ${currentUser.name}`, 105, 6, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }

        const statut = etudiant.present ? "Présent" : "Absent";
        const couleur = etudiant.present ? [0, 128, 0] : [255, 0, 0];

        pdf.setFontSize(10);
        pdf.setTextColor(...couleur);
        pdf.text(`${etudiant.numero}. ${etudiant.nom} - ${statut}`, 25, yPosition);
        yPosition += 7;
      });

      yPosition += 5;
    });

    yPosition += 10;
  });

  pdf.save(`presences_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
};


  // Export functions with teacher name
  const exporterPDF = async (type) => {
    const pdf = new jsPDF();
    
    // En-tête avec style et nom de l'enseignant
    pdf.setFillColor(41, 128, 185);
    pdf.rect(0, 0, 220, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text('Assistant Enseignant', 105, 12, { align: 'center' });
    
    // Add teacher name
    pdf.setFontSize(12);
    pdf.text(`Enseignant: ${currentUser.name}`, 105, 22, { align: 'center' });
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(10, 35, 200, 35);
    
    if (type === 'cours') {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text('Plan de Cours', 105, 45, { align: 'center' });
      
      let yPosition = 55;
      
      for (let i = 0; i < diapositives.length; i++) {
        const diapo = diapositives[i];
        
        // Vérifier si on doit ajouter une nouvelle page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
          
          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(`Enseignant: ${currentUser.name}`, 105, 6, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(`Diapositive ${i + 1}: ${diapo.titre}`, 15, yPosition);
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        yPosition += 7;
        pdf.text(`Description: ${diapo.description}`, 20, yPosition);
        
        yPosition += 5;
        pdf.text(`Durée: ${diapo.duree} minutes`, 20, yPosition);
        
        yPosition += 5;
        pdf.text(`Objectifs: ${diapo.objectifs}`, 20, yPosition);
        
        yPosition += 5;
        
        // Ajouter le contenu avec gestion du texte long
        const contenuLines = pdf.splitTextToSize(`Contenu: ${diapo.contenu}`, 170);
        pdf.text(contenuLines, 20, yPosition);
        yPosition += (contenuLines.length * 5) + 5;
        
        // Ajouter les images si elles existent
        if (diapo.images && diapo.images.length > 0) {
          pdf.setTextColor(52, 152, 219);
          pdf.text("Images incluses:", 20, yPosition);
          yPosition += 7;
          
          for (let j = 0; j < diapo.images.length; j++) {
            const image = diapo.images[j];
            
            // Vérifier si on doit ajouter une nouvelle page pour l'image
            if (yPosition > 180) {
              pdf.addPage();
              yPosition = 20;
              
              // Add teacher name on each page
              pdf.setFillColor(41, 128, 185);
              pdf.rect(0, 0, 220, 10, 'F');
              pdf.setTextColor(255, 255, 255);
              pdf.setFontSize(10);
              pdf.text(`Enseignant: ${currentUser.name}`, 105, 6, { align: 'center' });
              pdf.setTextColor(0, 0, 0);
            }
            
            try {
              // Déterminer le format de l'image
              const format = image.type.includes('png') ? 'PNG' : 'JPEG';
              
              // Ajouter l'image au PDF (taille réduite pour s'adapter)
              pdf.addImage(image.data, format, 25, yPosition, 50, 50);
              pdf.setTextColor(100, 100, 100);
              pdf.setFontSize(8);
              pdf.text(`Image: ${image.name}`, 80, yPosition + 25);
              
              yPosition += 60;
              pdf.setFontSize(10);
            } catch (error) {
              console.error("Erreur lors de l'ajout de l'image:", error);
              pdf.setTextColor(255, 0, 0);
              pdf.text("Erreur de chargement de l'image", 25, yPosition);
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
      
      pdf.save(`plan_de_cours_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
    } 
    else if (type === 'exercices') {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text('Exercices', 105, 45, { align: 'center' });
      
      let yPosition = 55;
      
      exercices.forEach((exercice, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
          
          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(`Enseignant: ${currentUser.name}`, 105, 6, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(`Exercice ${index + 1} (${exercice.points} points) - Difficulté: ${exercice.difficulte}`, 15, yPosition);
        
        yPosition += 7;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        // Gestion du texte long avec word wrap
        const questionLines = pdf.splitTextToSize(exercice.question, 180);
        pdf.text(questionLines, 20, yPosition);
        
        yPosition += (questionLines.length * 5) + 5;
        
        // Ligne séparatrice
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, 195, yPosition);
        yPosition += 10;
      });
      
      pdf.save(`exercices_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
    }
    else if (type === 'solutions') {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text('Solutions des Exercices', 105, 45, { align: 'center' });
      
      let yPosition = 55;
      
      exercices.forEach((exercice, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
          
          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(`Enseignant: ${currentUser.name}`, 105, 6, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(`Exercice ${index + 1}`, 15, yPosition);
        
        yPosition += 7;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        // Question
        pdf.setFont(undefined, 'bold');
        pdf.text('Question:', 20, yPosition);
        
        yPosition += 5;
        pdf.setFont(undefined, 'normal');
        const questionLines = pdf.splitTextToSize(exercice.question, 180);
        pdf.text(questionLines, 25, yPosition);
        
        yPosition += (questionLines.length * 5) + 5;
        
        // Solution
        pdf.setFont(undefined, 'bold');
        pdf.text('Solution:', 20, yPosition);
        
        yPosition += 5;
        pdf.setFont(undefined, 'normal');
        const solutionLines = pdf.splitTextToSize(exercice.solution, 180);
        pdf.text(solutionLines, 25, yPosition);
        
        yPosition += (solutionLines.length * 5) + 10;
        
        // Ligne séparatrice
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, 195, yPosition);
        yPosition += 10;
      });
      
      pdf.save(`solutions_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
    }
    else if (type === 'planification') {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text('Planning Hebdomadaire', 105, 45, { align: 'center' });
      
      let yPosition = 55;
      
      Object.entries(planHebdo).forEach(([jour, activites], index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
          
          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(`Enseignant: ${currentUser.name}`, 105, 6, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(jour, 15, yPosition);
        
        yPosition += 7;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        pdf.text('Matin:', 20, yPosition);
        const matinLines = pdf.splitTextToSize(activites.matin, 170);
        pdf.text(matinLines, 30, yPosition);
        
        yPosition += (matinLines.length * 5) + 5;
        
        pdf.text('Après-midi:', 20, yPosition);
        const apremLines = pdf.splitTextToSize(activites.aprem, 170);
        pdf.text(apremLines, 35, yPosition);
        
        yPosition += (apremLines.length * 5) + 10;
        
        // Ligne séparatrice
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, 195, yPosition);
        yPosition += 10;
      });
      
      pdf.save(`planning_hebdomadaire_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
    }
    else if (type === 'quiz') {
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.text('Quiz: ' + quizzes[currentQuiz].title, 105, 45, { align: 'center' });
      
      let yPosition = 55;
      
      quizzes[currentQuiz].questions.forEach((question, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
          
          // Add teacher name on each page
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, 220, 10, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(`Enseignant: ${currentUser.name}`, 105, 6, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(52, 152, 219);
        pdf.text(`Question ${index + 1} (${question.points} points) - Time: ${question.timeLimit}s`, 15, yPosition);
        
        yPosition += 7;
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        
        // Question text
        const questionLines = pdf.splitTextToSize(question.questionText, 180);
        pdf.text(questionLines, 20, yPosition);
        yPosition += (questionLines.length * 5) + 5;
        
        // Options
        question.options.forEach((option, optIndex) => {
          const prefix = optIndex === question.correctAnswer ? '✓ ' : '○ ';
          pdf.text(prefix + option, 25, yPosition);
          yPosition += 5;
        });
        
        yPosition += 10;
        // Ligne séparatrice
        pdf.setDrawColor(200, 200, 200);
        pdf.line(15, yPosition, 195, yPosition);
        yPosition += 15;
      });
      
      pdf.save(`quiz_${quizzes[currentQuiz].title.replace(/\s+/g, '_')}_${currentUser.name.replace(/\s+/g, '_')}.pdf`);
    }
  };

  // Login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>Connexion à Assistant Enseignant</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Nom d'utilisateur:</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Mot de passe:</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>
            <button type="submit">Se connecter</button>
          </form>
          
        </div>
      </div>
    );
  }

  // Main application if authenticated
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-user">
          <h4> <h1>Assistant Enseignant</h1>
            
            par <b> lasmar soufiane</b>
          </h4>
          <div className="user-info">
            <span>Connecté en tant que: {currentUser.name}</span>
            <button onClick={handleLogout} className="logout-btn">Déconnexion</button>
          </div>
        </div>
        <nav className="onglets">
          <button 
            className={ongletActif === 'tableauBlanc' ? 'actif' : ''} 
            onClick={() => setOngletActif('tableauBlanc')}
          >
            Tableau Blanc
          </button>
          <button 
            className={ongletActif === 'cours' ? 'actif' : ''} 
            onClick={() => setOngletActif('cours')}
          >
            Création de Cours
          </button>
          <button 
            className={ongletActif === 'exercices' ? 'actif' : ''} 
            onClick={() => setOngletActif('exercices')}
          >
            Exercices
          </button>
          <button 
            className={ongletActif === 'quiz' ? 'actif' : ''} 
            onClick={() => setOngletActif('quiz')}
          >
            Quiz
          </button>
          <button 
            className={ongletActif === 'planification' ? 'actif' : ''} 
            onClick={() => setOngletActif('planification')}
          >
            Planification Hebdo
          </button>
          <button 
            className={ongletActif === 'absence' ? 'actif' : ''} 
            onClick={() => setOngletActif('absence')}
          >
            Présences
          </button>
        </nav>
      </header>

      <main className="contenu-principal">
        {ongletActif === 'tableauBlanc' && (
          <div className="tableau-blanc-container">
            <div className="controles-tableau">
              <label>
                Couleur du tableau:
                <input 
                  type="color" 
                  value={couleurTableau} 
                  onChange={(e) => setCouleurTableau(e.target.value)} 
                />
              </label>
              <label>
                Couleur du stylo:
                <input 
                  type="color" 
                  value={couleurStylo} 
                  onChange={(e) => setCouleurStylo(e.target.value)} 
                />
              </label>
              <label>
                Taille du stylo:
                <input 
                  type="range" 
                  min="1" 
                  max="20" 
                  value={tailleStylo} 
                  onChange={(e) => setTailleStylo(parseInt(e.target.value))} 
                />
                {tailleStylo}px
              </label>
              <button onClick={effacerTableau}>Effacer le tableau</button>
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

        {ongletActif === 'cours' && (
          <div className="creation-cours">
            <div className="controles-diapositives">
              <button onClick={ajouterDiapositive}>+ Ajouter une diapositive</button>
              <button onClick={() => exporterPDF('cours')}>Exporter le cours (PDF)</button>
            </div>
            <div className="navigation-diapositives">
              {diapositives.map((diapo, index) => (
                <button
                  key={index}
                  className={diapositiveCourante === index ? 'actif' : ''}
                  onClick={() => setDiapositiveCourante(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            {diapositives.length > 0 && (
              <div className="editeur-diapositive">
                <div className="diapositive-header">
                  <h3>Diapositive {diapositiveCourante + 1}</h3>
                  <button onClick={() => supprimerDiapositive(diapositiveCourante)}>
                    Supprimer
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Titre de la diapositive:</label>
                  <input
                    type="text"
                    value={diapositives[diapositiveCourante].titre}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].titre = e.target.value;
                      setDiapositives(nouvellesDiapositives);
                    }}
                    placeholder="Titre de la diapositive"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description:</label>
                  <input
                    type="text"
                    value={diapositives[diapositiveCourante].description}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].description = e.target.value;
                      setDiapositives(nouvellesDiapositives);
                    }}
                    placeholder="Description courte"
                  />
                </div>
                
                <div className="form-group">
                  <label>Objectifs d'apprentissage:</label>
                  <input
                    type="text"
                    value={diapositives[diapositiveCourante].objectifs}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].objectifs = e.target.value;
                      setDiapositives(nouvellesDiapositives);
                    }}
                    placeholder="Objectifs pédagogiques"
                  />
                </div>
                
                <div className="form-group">
                  <label>Durée (minutes):</label>
                  <input
                    type="number"
                    min="1"
                    value={diapositives[diapositiveCourante].duree}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].duree = parseInt(e.target.value);
                      setDiapositives(nouvellesDiapositives);
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label>Contenu détaillé:</label>
                  <textarea
                    value={diapositives[diapositiveCourante].contenu}
                    onChange={(e) => {
                      const nouvellesDiapositives = [...diapositives];
                      nouvellesDiapositives[diapositiveCourante].contenu = e.target.value;
                      setDiapositives(nouvellesDiapositives);
                    }}
                    placeholder="Contenu de la diapositive..."
                    rows="8"
                  />
                </div>
                
                <div className="form-group">
                  <label>Images:</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button onClick={() => fileInputRef.current.click()}>
                    Ajouter une image
                  </button>
                  
                  <div className="images-container">
                    {diapositives[diapositiveCourante].images && 
                     diapositives[diapositiveCourante].images.map((image, index) => (
                      <div key={index} className="image-item">
                        <img src={image.data} alt="image"  />
                        <span className="image-name">{image.name}</span>
                        <button onClick={() => supprimerImage(index)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {ongletActif === 'exercices' && (
          <div className="creation-exercices">
            <h2>Création d'Exercices</h2>
            <div className="controles-exercices">
              <button onClick={ajouterExercice}>+ Nouvel exercice</button>
              <button onClick={() => exporterPDF('exercices')}>Exporter exercices (PDF)</button>
              <button onClick={() => exporterPDF('solutions')}>Exporter solutions (PDF)</button>
            </div>
            
            <div className="liste-exercices">
              {exercices.map((exercice, index) => (
                <div key={index} className="exercice-item">
                  <div className="exercice-header">
                    <h3>Exercice {index + 1}</h3>
                    <button onClick={() => supprimerExercice(index)}>
                      Supprimer
                      </button>
                  </div>
                  
                  <div className="form-group">
                    <label>Question:</label>
                    <textarea
                      value={exercice.question}
                      onChange={(e) => {
                        const nouveauxExercices = [...exercices];
                        nouveauxExercices[index].question = e.target.value;
                        setExercices(nouveauxExercices);
                      }}
                      placeholder="Énoncé de l'exercice..."
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Solution:</label>
                    <textarea
                      value={exercice.solution}
                      onChange={(e) => {
                        const nouveauxExercices = [...exercices];
                        nouveauxExercices[index].solution = e.target.value;
                        setExercices(nouveauxExercices);
                      }}
                      placeholder="Solution de l'exercice..."
                      rows="3"
                    />
                  </div>
                  
                  <div className="exercice-props">
                    <div className="form-group">
                      <label>Difficulté:</label>
                      <select
                        value={exercice.difficulte}
                        onChange={(e) => {
                          const nouveauxExercices = [...exercices];
                          nouveauxExercices[index].difficulte = e.target.value;
                          setExercices(nouveauxExercices);
                        }}
                      >
                        <option value="facile">Facile</option>
                        <option value="moyen">Moyen</option>
                        <option value="difficile">Difficile</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Points:</label>
                      <input
                        type="number"
                        min="1"
                        value={exercice.points}
                        onChange={(e) => {
                          const nouveauxExercices = [...exercices];
                          nouveauxExercices[index].points = parseInt(e.target.value);
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

        {ongletActif === 'quiz' && !quizEnCours && (
          <div className="creation-quiz">
            <h2>Création de Quiz</h2>
            <div className="controles-quiz">
              <button onClick={ajouterQuiz}>+ Nouveau quiz</button>
              <button onClick={() => exporterPDF('quiz')}>Exporter quiz (PDF)</button>
            </div>
            
            <div className="navigation-quiz">
              {quizzes.map((quiz, index) => (
                <button
                  key={quiz.id}
                  className={currentQuiz === index ? 'actif' : ''}
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
                    <button onClick={() => demarrerQuiz(currentQuiz)} style={{marginRight: '10px'}}>
                      Démarrer ce quiz
                    </button>
                    <button onClick={() => supprimerQuiz(currentQuiz)}>
                      Supprimer le quiz
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Titre du quiz:</label>
                  <input
                    type="text"
                    value={quizzes[currentQuiz].title}
                    onChange={(e) => {
                      const nouveauxQuizzes = [...quizzes];
                      nouveauxQuizzes[currentQuiz].title = e.target.value;
                      setQuizzes(nouveauxQuizzes);
                    }}
                    placeholder="Titre du quiz"
                  />
                </div>
                
                <div className="form-group">
                  <label>Description:</label>
                  <textarea
                    value={quizzes[currentQuiz].description}
                    onChange={(e) => {
                      const nouveauxQuizzes = [...quizzes];
                      nouveauxQuizzes[currentQuiz].description = e.target.value;
                      setQuizzes(nouveauxQuizzes);
                    }}
                    placeholder="Description du quiz..."
                    rows="2"
                  />
                </div>
                
                <div className="questions-header">
                  <h4>Questions</h4>
                  <button onClick={ajouterQuestion}>+ Ajouter une question</button>
                </div>
                
                <div className="navigation-questions">
                  {quizzes[currentQuiz].questions.map((question, index) => (
                    <button
                      key={question.id}
                      className={currentQuestion === index ? 'actif' : ''}
                      onClick={() => setCurrentQuestion(index)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                
                {quizzes[currentQuiz].questions.length > 0 && (
                  <div className="editeur-question">
                    <div className="question-header">
                      <h5>Question {currentQuestion + 1}</h5>
                      <button onClick={() => supprimerQuestion(currentQuestion)}>
                        Supprimer
                      </button>
                    </div>
                    
                    <div className="form-group">
                      <label>Type de question:</label>
                      <select
                        value={quizzes[currentQuiz].questions[currentQuestion].type}
                        onChange={(e) => {
                          const nouveauxQuizzes = [...quizzes];
                          nouveauxQuizzes[currentQuiz].questions[currentQuestion].type = e.target.value;
                          setQuizzes(nouveauxQuizzes);
                        }}
                      >
                        <option value="multiple">Choix multiple</option>
                        <option value="text">Réponse texte</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Question:</label>
                      <textarea
                        value={quizzes[currentQuiz].questions[currentQuestion].questionText}
                        onChange={(e) => {
                          const nouveauxQuizzes = [...quizzes];
                          nouveauxQuizzes[currentQuiz].questions[currentQuestion].questionText = e.target.value;
                          setQuizzes(nouveauxQuizzes);
                        }}
                        placeholder="Énoncé de la question..."
                        rows="3"
                      />
                    </div>
                    
                    {quizzes[currentQuiz].questions[currentQuestion].type === 'multiple' && (
                      <>
                        <div className="form-group">
                          <label>Options de réponse:</label>
                          {quizzes[currentQuiz].questions[currentQuestion].options.map((option, optIndex) => (
                            <div key={optIndex} className="option-row">
                              <input
                                type="radio"
                                name={`correctAnswer-${currentQuestion}`}
                                checked={quizzes[currentQuiz].questions[currentQuestion].correctAnswer === optIndex}
                                onChange={() => {
                                  const nouveauxQuizzes = [...quizzes];
                                  nouveauxQuizzes[currentQuiz].questions[currentQuestion].correctAnswer = optIndex;
                                  setQuizzes(nouveauxQuizzes);
                                }}
                              />
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const nouveauxQuizzes = [...quizzes];
                                  nouveauxQuizzes[currentQuiz].questions[currentQuestion].options[optIndex] = e.target.value;
                                  setQuizzes(nouveauxQuizzes);
                                }}
                                placeholder={`Option ${optIndex + 1}`}
                              />
                            </div>
                          ))}
                        </div>
                        
                        <div className="question-props">
                          <div className="form-group">
                            <label>Points:</label>
                            <input
                              type="number"
                              min="1"
                              value={quizzes[currentQuiz].questions[currentQuestion].points}
                              onChange={(e) => {
                                const nouveauxQuizzes = [...quizzes];
                                nouveauxQuizzes[currentQuiz].questions[currentQuestion].points = parseInt(e.target.value);
                                setQuizzes(nouveauxQuizzes);
                              }}
                            />
                          </div>
                          
                          <div className="form-group">
                            <label>Limite de temps (secondes):</label>
                            <input
                              type="number"
                              min="5"
                              value={quizzes[currentQuiz].questions[currentQuestion].timeLimit}
                              onChange={(e) => {
                                const nouveauxQuizzes = [...quizzes];
                                nouveauxQuizzes[currentQuiz].questions[currentQuestion].timeLimit = parseInt(e.target.value);
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

        {ongletActif === 'quiz' && quizEnCours && (
          <div className="quiz-player">
            <div className="quiz-header">
              <h2>{quizEnCours.title}</h2>
              <button onClick={quitterQuiz}>Quitter le quiz</button>
            </div>
            
            {!quizTermine ? (
              <div className="question-container">
                <div className="question-progress">
                  <p>Question {questionActuelle + 1} sur {quizEnCours.questions.length}</p>
                  <p>Temps restant: {tempsRestant} secondes</p>
                </div>
                
                <div className="question-content">
                  <h3>{quizEnCours.questions[questionActuelle].questionText}</h3>
                  
                  {quizEnCours.questions[questionActuelle].type === 'multiple' && (
                    <div className="options-container">
                      {quizEnCours.questions[questionActuelle].options.map((option, index) => (
                        <button
                          key={index}
                          className="option-btn"
                          onClick={() => handleReponse(index)}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {quizEnCours.questions[questionActuelle].type === 'text' && (
                    <div className="text-answer-container">
                      <textarea placeholder="Votre réponse..." rows="4"></textarea>
                      <button onClick={() => handleReponse(0)}>Soumettre</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="quiz-results">
                <h3>Quiz Terminé!</h3>
                <p>Votre score: {scoreQuiz} points</p>
                <p>Réponses correctes: {reponsesUtilisateur.filter(r => r.estCorrecte).length} sur {quizEnCours.questions.length}</p>
                
                <div className="answers-review">
                  <h4>Détail des réponses:</h4>
                  {quizEnCours.questions.map((question, index) => {
                    const userAnswer = reponsesUtilisateur.find(r => r.questionId === question.id);
                    return (
                      <div key={question.id} className="answer-item">
                        <p><strong>Question {index + 1}:</strong> {question.questionText}</p>
                        <p className={userAnswer && userAnswer.estCorrecte ? 'correct' : 'incorrect'}>
                          {userAnswer 
                            ? `Votre réponse: ${question.type === 'multiple' ? question.options[userAnswer.reponse] : 'Réponse texte'}`
                            : 'Aucune réponse'
                          }
                        </p>
                        {question.type === 'multiple' && (
                          <p>Réponse correcte: {question.options[question.correctAnswer]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <button onClick={quitterQuiz}>Retour à l'éditeur de quiz</button>
              </div>
            )}
          </div>
        )}

        {ongletActif === 'planification' && (
          <div className="planification-hebdo">
            <h2>Planification Hebdomadaire</h2>
            <div className="controles-planification">
              <button onClick={() => exporterPDF('planification')}>Exporter le planning (PDF)</button>
            </div>
            
            <div className="editeur-planning">
              {Object.entries(planHebdo).map(([jour, activites]) => (
                <div key={jour} className="jour-planning">
                  <h3>{jour}</h3>
                  
                  <div className="form-group">
                    <label>Matin:</label>
                    <textarea
                      value={activites.matin}
                      onChange={(e) => {
                        setPlanHebdo({
                          ...planHebdo,
                          [jour]: { ...activites, matin: e.target.value }
                        });
                      }}
                      placeholder={`Activités du matin...`}
                      rows="3"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Après-midi:</label>
                    <textarea
                      value={activites.aprem}
                      onChange={(e) => {
                        setPlanHebdo({
                          ...planHebdo,
                          [jour]: { ...activites, aprem: e.target.value }
                        });
                      }}
                      placeholder={`Activités de l'après-midi...`}
                      rows="3"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ongletActif === 'absence' && (
          <div className="gestion-absence">
            <h2>Gestion des Présences</h2>
            
            <div className="controles-absence">
              <button onClick={ajouterGroupe}>+ Nouveau groupe</button>
              <button onClick={exporterAbsencesPDF}>Exporter présences (PDF)</button>
            </div>
            
            <div className="groupes-list">
              <h3>Groupes</h3>
              {groupes.length === 0 ? (
                <p>Aucun groupe créé. Cliquez sur "Nouveau groupe" pour commencer.</p>
              ) : (
                <div className="groupes-buttons">
                  {groupes.map(groupe => (
                    <button
                      key={groupe.id}
                      className={currentGroupe && currentGroupe.id === groupe.id ? 'actif' : ''}
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
                    Supprimer le groupe
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Nom du groupe:</label>
                  <input
                    type="text"
                    value={currentGroupe.nom}
                    onChange={(e) => {
                      const nouveauxGroupes = groupes.map(g => 
                        g.id === currentGroupe.id ? { ...g, nom: e.target.value } : g
                      );
                      setGroupes(nouveauxGroupes);
                      setCurrentGroupe(nouveauxGroupes.find(g => g.id === currentGroupe.id));
                    }}
                  />
                </div>
                
                <div className="etudiants-list">
                  <h4>Étudiants</h4>
                  <button onClick={ajouterEtudiant}>+ Ajouter un étudiant</button>
                  
                  {currentGroupe.etudiants.length === 0 ? (
                    <p>Aucun étudiant dans ce groupe.</p>
                  ) : (
                    <div className="liste-etudiants">
                      {currentGroupe.etudiants.map(etudiant => (
                        <div key={etudiant.id} className="etudiant-item">
                          <div className="etudiant-info">
                            <span className="etudiant-numero">{etudiant.numero}.</span>
                            <input
                              type="text"
                              value={etudiant.nom}
                              onChange={(e) => handleNomEtudiantChange(etudiant.id, e.target.value)}
                              className="etudiant-nom"
                            />
                          </div>
                          <label className="presence-label">
                            <input
                              type="checkbox"
                              checked={etudiant.present}
                              onChange={(e) => handlePresenceChange(etudiant.id, e.target.checked)}
                            />
                            Présent
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="enregistrement-absence">
                  <h4>Enregistrer les présences</h4>
                  <div className="form-group">
                    <label>Date:</label>
                    <input
                      type="date"
                      value={dateAbsence}
                      onChange={(e) => setDateAbsence(e.target.value)}
                    />
                  </div>
                  
                  <div className="liste-presence">
                    <h4>Liste des étudiants - {dateAbsence}</h4>
                    {currentGroupe.etudiants.map(etudiant => (
                      <div key={etudiant.id} className="ligne-presence">
                        <span className="etudiant-info">
                          {etudiant.numero}. {etudiant.nom}
                        </span>
                        <label className="switch-presence">
                          <input
                            type="checkbox"
                            checked={etudiant.present}
                            onChange={(e) => handlePresenceChange(etudiant.id, e.target.checked)}
                          />
                          <span className="slider">{etudiant.present ? 'Présent' : 'Absent'}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <button onClick={enregistrerAbsences}>
                    Enregistrer les présences pour cette date
                  </button>
                </div>
              </div>
            )}
            
            <div className="historique-absences">
              <h3>Historique des présences</h3>
              {absences.length === 0 ? (
                <p>Aucune présence enregistrée.</p>
              ) : (
                <div className="liste-absences">
                  {absences.map(absence => (
                    <div key={absence.id} className="absence-item">
                      <h4>{absence.groupe} - {absence.date}</h4>
                      <ul>
                        {absence.etudiantsAbsents && absence.etudiantsAbsents.map((etudiant, index) => (
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