const CREATE_TABLE_SQL =
  "CREATE TABLE test_table (id integer primary key, record text)";

const INSERT_TABLE_SQL =
  "INSERT INTO test_table (id, record) values(2, 'hello man01')";

const UPDATE_TABLE_SQL =
  "UPDATE test_table SET record = 'hello man02' WHERE id = 2";

export { CREATE_TABLE_SQL, INSERT_TABLE_SQL, UPDATE_TABLE_SQL };
