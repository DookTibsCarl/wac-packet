BEGIN {
	# We use quote-comma-quote as delimiter since there are commas within some fields and this is a quick & easy solution.
	# downside is that some fields have leading/trailing commas that we need to strip out. As luck would have it, we're
	# interested in both of those fields
	FS="\",\""
}

# Grab students who have marked their submission as "Complete"
# "Completed" == $41 && ("Completed" != $17 || "Completed" != $19) {
"Completed" == $41 && ("Completed" != $17) {
	$1 = substr($1, 2) # strip leading quote from name
	sub(/@carleton.edu/, "", $2) # strip domain from email
	printf "%s|%s|metadata=%s|research_auth=%s\n", $2, $1, $17, $19
	# printf "%s|%s|metadata=%s\n", $2, $1, $17
	# printf "%s|%s|researchAuth=%s\n", $2, $1, $19
}
