#!/usr/bin/osascript

property wordExtensions : {"doc", "docx"}
on run argv
	if count of argv equals 1
		set inputFile to item 1 of argv
		set ext to do shell script "echo " & (quoted form of inputFile) & " | sed 's/.*\\.\\(.*\\)/\\1/'"
		-- set outputFile to do shell script "echo " & (quoted form of inputFile) & " | sed 's/.*\\/\\(.*\\)\\..*/\\1.pdf/'"
		set outputFile to "wordToPdfConverted.pdf"

		try
            tell application "Finder"
                if ext is in wordExtensions then
                    tell application "Microsoft Word"
						open inputFile
                        set theActiveDoc to the active document
                        save as theActiveDoc file format format PDF file name outputFile
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
