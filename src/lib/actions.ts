
'use server';

import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, setDoc, getDoc, writeBatch, updateDoc } from 'firebase/firestore';
import type { QuizData } from './types';

// Check if a user has already completed the quiz
export async function hasUserCompletedQuiz(email: string) {
  const q = query(collection(db, 'results'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// Save quiz results to Firestore
export async function saveQuizResult(data: { name: string; email: string; time: number; explanation: string, quizId: string }) {
  try {
    // Save the quiz result
    await addDoc(collection(db, 'results'), {
      ...data,
      completedAt: serverTimestamp(),
    });

    // Update the participant's status in the lobby
    const participantRef = doc(db, 'lobby', 'main_lobby', 'participants', data.email);
    const participantSnap = await getDoc(participantRef);
    if(participantSnap.exists()) {
        await updateDoc(participantRef, { status: 'Completed' });
    }

    return { success: true };
  } catch (error) {
    console.error("Error writing document: ", error);
    // Don't expose detailed error messages to the client
    return { success: false, error: 'Failed to save results.' };
  }
}


// Add or update a quiz in Firestore
export async function saveQuiz(quizData: QuizData, isEditing: boolean) {
    try {
        const quizRef = doc(db, 'quizzes', quizData.id);

        if (!isEditing) {
            const docSnap = await getDoc(quizRef);
            if (docSnap.exists()) {
                return { success: false, error: "A quiz with this name already exists." };
            }
        }
        
        const dataToSave = {
            passage: quizData.passage,
            explanation: quizData.explanation,
            rootCauses: quizData.rootCauses,
            correctRootCause: quizData.correctRootCause,
        };

        await setDoc(quizRef, dataToSave, { merge: isEditing });

        return { success: true, id: quizData.id };
    } catch (error) {
        console.error("Error saving quiz: ", error);
        return { success: false, error: "Failed to save quiz." };
    }
}

export async function addPlayerToLobby(player: {name: string, email: string}) {
    try {
        const lobbyRef = doc(db, 'lobby', 'main_lobby');
        const lobbySnap = await getDoc(lobbyRef);
        if (lobbySnap.exists() && lobbySnap.data().status === 'started') {
            return { success: false, error: 'A quiz is already in progress. Please wait.'};
        }
        await setDoc(doc(db, 'lobby', 'main_lobby', 'participants', player.email), {
            ...player,
            status: 'In Lobby',
        });
        return { success: true };
    } catch (error) {
        console.error("Error adding player to lobby: ", error);
        return { success: false, error: "Failed to join lobby." };
    }
}

export async function startQuizForLobby(quizId: string) {
    try {
        const lobbyRef = doc(db, 'lobby', 'main_lobby');
        const participantsCollectionRef = collection(lobbyRef, 'participants');
        const participantsSnapshot = await getDocs(participantsCollectionRef);

        const batch = writeBatch(db);

        // Update status for all participants
        participantsSnapshot.forEach(participantDoc => {
            const docRef = doc(db, 'lobby', 'main_lobby', 'participants', participantDoc.id);
            batch.update(docRef, { status: 'In Progress' });
        });

        // Set lobby status
        batch.set(lobbyRef, {
            status: 'started',
            activeQuizId: quizId,
        });

        await batch.commit();

        return { success: true };
    } catch (error) {
        console.error("Error starting quiz: ", error);
        return { success: false, error: "Failed to start quiz." };
    }
}

export async function resetLobby() {
    try {
        const lobbyRef = doc(db, 'lobby', 'main_lobby');
        const participantsCollectionRef = collection(lobbyRef, 'participants');
        
        // Delete all participants in a batch
        const querySnapshot = await getDocs(participantsCollectionRef);
        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Reset the lobby status
        await setDoc(lobbyRef, {
            status: 'waiting',
            activeQuizId: null,
        });

        return { success: true };
    } catch (error) {
        console.error('Error resetting lobby: ', error);
        return { success: false, error: 'Failed to reset the lobby.' };
    }
}

    
