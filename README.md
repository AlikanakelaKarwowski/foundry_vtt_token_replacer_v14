# foundry_vtt_token_replacer_v14
Simple script for token image replacement for compendiums like amwellwind's Monster Hunter Compendium


# How to use.
1. Make sure your token images are in a folder in the format "/cr/token_name.extension"
2. Make sure your compendium actors names match **EXACTLY** with the name of your images (png,jpg,webp etc) if a space is needed use an underscore (_) between words.
3. Create a new macro in foundry
    3a. Make sure that the script is set to "script"
4. Paste the import_tokens.js into your script
5. Replace the variables "PACK_NAME", "IMAGE_FOLDER" to the correct names (ie world.mhmm-copy of a copy of the amellwind's MHMM compendium)
    5a. your compendium needs to be "unlocked"
6. DO A DRY RUN FIRST (set DRY_RUN = true)
7. Open dev console (f12 on most browsers) to check the console it should output some data about matches, duplicates found, and missing images
8. If everything looks good change DRY_RUN=false;
9. It might take a minute or 2 to update them
10. Enjoy. 

I made this super quickly cause i updated to foundry v14 and the usual token replacer module did not work and my images had disappeared. I will not be maintaining it, nor updating it and you can use this at your own risk. I highly recommend making a backup and a copy compendium to test this on so you dont mess anything up.