echo 'checking for database on db:5432';
until $(nc -zv db 5432); do { printf '.'; sleep 1; }; done
echo 'found database on db:5432!';
