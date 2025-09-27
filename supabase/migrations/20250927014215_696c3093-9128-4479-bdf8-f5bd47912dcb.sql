-- Update educational content URLs to match user requirements
UPDATE educational_content 
SET content_url = 'https://www.youtube.com/playlist?list=PLWAPsBbCQ-R1oqf3mI5EUbauCWcflv5oL'
WHERE title = 'Climate Change Basics';

UPDATE educational_content 
SET content_url = 'https://www.proprofs.com/quiz-school/topic/environment'
WHERE title = 'Renewable Energy Quiz';

UPDATE educational_content 
SET content_url = 'https://ecokids.net/'
WHERE title = 'Eco Warriors Game';

UPDATE educational_content 
SET content_url = 'https://www.green.earth/blog/trees-are-natures-water-managers-the-importance-of-trees-in-water-conservation'
WHERE title = 'Water Conservation Guide';