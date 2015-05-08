#!/usr/bin/osascript

-- DO NOT LOG ANYTHING IF YOU WANT TO BE CALLING THIS FROM NODE.JS execSync!!!

property wordExtensions : {"doc", "docx"}
on run argv
	if count of argv equals 1
		set inputFile to item 1 of argv
		set ext to do shell script "echo " & (quoted form of inputFile) & " | sed 's/.*\\.\\(.*\\)/\\1/'"
		set container to do shell script "echo " & (quoted form of inputFile) & " | sed 's/\\(.*\\/\\).*/\\1/'"
		-- set outputFile to do shell script "echo " & (quoted form of inputFile) & " | sed 's/.*\\/\\(.*\\)\\..*/\\1.pdf/'"
		set outputFile to "wordToPdfConverted.pdf"
		set outputPathUnix to container & "wordToPdfConverted.pdf"
		set outputPathFile to POSIX file outputPathUnix
		set outputPathMac to do shell script "echo " & outputPathFile & " | cut -d ':' -f 2-"

		-- log "outputpath: [" & outputPathUnix & "] / [" & outputPathMac & "]"

		-- set foo to POSIX file outputPath
		-- set foo to "Users:tfeiler:Desktop:foobar3.pdf"

		-- log "foo is [" & foo & "]"
		-- log "output file [" & outputFile & "]"

		-- echo "Macintosh HD:Users:tfeiler:development:moodle:portfolioExport:realData:essay:wordToPdfConve    rted.pdf" | cut -d ":" -f 2-

		try
            tell application "Finder"
                if ext is in wordExtensions then
                    tell application "Microsoft Word"
						activate	
						-- set default file path file path type documents path path container
						open inputFile
                        set theActiveDoc to the active document
                        -- save as theActiveDoc file format format PDF file name outputFile
                        save as theActiveDoc file format format PDF file name outputPathMac
                        close theActiveDoc
                    end tell
                end if

            end tell
		on error errMsg
			log "Error: " & errMsg
        end try

	else
		log "Usage: wordToPdf.scpt <inputFile>"
	end if

end run
