/**
 * DEBUG: Check if specific animes are in Fall 2025 season API
 * 
 * Run this to debug why animes 57025 and 59062 are not being synced
 */

const MISSING_ANIME_IDS = [57025, 59062, 62405];

async function checkAnimes() {
  console.log('🔍 Checking if missing animes are in Fall 2025 season...\n');

  try {
    // 1. Check Fall 2025 season
    const seasonUrl = 'https://api.jikan.moe/v4/seasons/2025/fall';
    console.log(`📡 Fetching: ${seasonUrl}\n`);
    
    const response = await fetch(seasonUrl);
    const data = await response.json();
    
    console.log(`📊 Total animes in Fall 2025: ${data.data.length}\n`);

    for (const animeId of MISSING_ANIME_IDS) {
      const anime = data.data.find((a: any) => a.mal_id === animeId);
      
      if (anime) {
        console.log(`✅ FOUND anime ${animeId} in Fall 2025:`);
        console.log(`   Title: ${anime.title}`);
        console.log(`   Status: ${anime.status}`);
        console.log(`   Members: ${anime.members}`);
        console.log(`   Type: ${anime.type}`);
        console.log(`   Aired: ${anime.aired?.from || 'N/A'}`);
        console.log('');
      } else {
        console.log(`❌ NOT FOUND anime ${animeId} in Fall 2025 season`);
        console.log(`   Checking directly via API...\n`);
        
        // Check the anime directly
        await new Promise(resolve => setTimeout(resolve, 1000));
        const animeUrl = `https://api.jikan.moe/v4/anime/${animeId}`;
        const animeResponse = await fetch(animeUrl);
        const animeData = await animeResponse.json();
        
        if (animeData.data) {
          console.log(`   Title: ${animeData.data.title}`);
          console.log(`   Season: ${animeData.data.season || 'N/A'} ${animeData.data.year || 'N/A'}`);
          console.log(`   Status: ${animeData.data.status}`);
          console.log(`   Members: ${animeData.data.members}`);
          console.log(`   Type: ${animeData.data.type}`);
          console.log(`   Aired: ${animeData.data.aired?.from || 'N/A'}`);
          console.log('');
        }
      }
      
      // Check episodes
      await new Promise(resolve => setTimeout(resolve, 1000));
      const episodesUrl = `https://api.jikan.moe/v4/anime/${animeId}/episodes`;
      console.log(`📺 Checking episodes for anime ${animeId}...`);
      const episodesResponse = await fetch(episodesUrl);
      const episodesData = await episodesResponse.json();
      
      if (episodesData.data && episodesData.data.length > 0) {
        console.log(`   Total episodes: ${episodesData.data.length}`);
        episodesData.data.forEach((ep: any, idx: number) => {
          if (idx < 5) { // Show first 5 episodes
            console.log(`   EP${ep.mal_id}: ${ep.title || 'Untitled'} - Aired: ${ep.aired || 'No date'} - Score: ${ep.score || 'N/A'}`);
          }
        });
      } else {
        console.log(`   No episodes found`);
      }
      
      console.log('\n---\n');
    }
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('If an anime is NOT in Fall 2025 season, it will NOT be synced by the current sync function.');
    console.log('You need to either:');
    console.log('1. Add the anime manually to the database');
    console.log('2. Modify the sync function to check multiple seasons');
    console.log('3. Check if the anime has the correct season/year in MyAnimeList');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAnimes();
