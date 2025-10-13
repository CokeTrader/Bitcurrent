/**
 * Educational Content Service
 * Learn to trade platform
 */

const pool = require('../config/database');

class EducationalContent {
  async getCourses() {
    const courses = [
      {
        id: 1,
        title: 'Bitcoin Basics',
        lessons: 10,
        duration: '2 hours',
        difficulty: 'beginner',
        reward: 10 // £10 completion bonus
      },
      {
        id: 2,
        title: 'Technical Analysis Mastery',
        lessons: 20,
        duration: '5 hours',
        difficulty: 'intermediate',
        reward: 25
      },
      {
        id: 3,
        title: 'Advanced Trading Strategies',
        lessons: 30,
        duration: '10 hours',
        difficulty: 'advanced',
        reward: 50
      }
    ];

    return { success: true, courses };
  }

  async completelesson(userId, lessonId) {
    await pool.query(
      `INSERT INTO lesson_completions (user_id, lesson_id, completed_at)
       VALUES ($1, $2, NOW())`,
      [userId, lessonId]
    );

    return { success: true, message: 'Lesson completed', xpEarned: 100 };
  }

  async awardCourseCompletion(userId, courseId) {
    const courses = await this.getCourses();
    const course = courses.courses.find(c => c.id === courseId);

    if (course) {
      await pool.query(
        `INSERT INTO rewards (user_id, type, amount, description, created_at)
         VALUES ($1, 'education', $2, $3, NOW())`,
        [userId, course.reward, `Completed: ${course.title}`]
      );

      await pool.query(
        'UPDATE users SET gbp_balance = gbp_balance + $1 WHERE id = $2',
        [course.reward, userId]
      );
    }

    return { success: true, reward: course?.reward || 0 };
  }
}

module.exports = new EducationalContent();

