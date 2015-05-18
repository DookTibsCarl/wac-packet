BEGIN {
	# We use quote-comma-quote as delimiter since there are commas within some fields and this is a quick & easy solution.
	# downside is that some fields have leading/trailing commas that we need to strip out. As luck would have it, we're
	# interested in both of those fields
	FS="\",\""
}

# Grab all students
{
	$1 = substr($1, 2) # strip leading quote from name
	sub(/@carleton.edu/, "", $2) # strip domain from email
	sub(/"/, "", $42) # strip trailing quote from date
	printf "%s|%s|%s\n", $2, $1, $42
}
