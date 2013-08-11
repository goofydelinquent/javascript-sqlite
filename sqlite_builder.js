function StatementBuilder() {
  
  function isNumber(val) {
    switch (typeof val) {
    case 'number':
      return true;
    case 'string':
      return (/^\d+$/).test(val);
    case 'object':
      return false;
    }
  }

  function buildConditions(conditions) {
    var results = [], values = [], x;

    if (typeof conditions === 'string') {
      results.push(conditions);
    } else if (typeof conditions === 'number') {
      results.push("id=?");
      values.push(conditions);
    } else if (typeof conditions === 'object') {
      for (x in conditions) {
        if (conditions.hasOwnProperty(x)) {
          if (isNumber(x)) {
            results.push(conditions[x]);
          } else {
            results.push(x + '=?');
            values.push(conditions[x]);
          }
        }
      }
    }

    if (results.length > 0) {
      results = " WHERE " + results.join(' AND ');
    } else {
      results = '';
    }

    return [results, values];
  }

  function createTableSQL(name, cols) {
    var query = "CREATE TABLE " + name + "(" + cols + ");";

    return [query, []];
  }

  function dropTableSQL(name) {
    var query = "DROP TABLE " + name + ";";

    return [query, []];
  }

  function insertSQL(table, map) {
    var query = "INSERT INTO " + table + " (#k#) VALUES(#v#);", keys = [], holders = [], values = [], x;

    for (x in map) {
      if (map.hasOwnProperty(x)) {
        keys.push(x);
        holders.push('?');
        values.push(map[x]);
      }
    }

    query = query.replace("#k#", keys.join(','));
    query = query.replace("#v#", holders.join(','));

    return [query, values];
  }

  function updateSQL(table, map, conditions) {
    var query = "UPDATE " + table + " SET #k##m#", keys = [], values = [], x;

    for (x in map) {
      if (map.hasOwnProperty(x)) {
        keys.push(x + '=?');
        values.push(map[x]);
      }
    }

    conditions = buildConditions(conditions);

    values = values.concat(conditions[1]);

    query = query.replace("#k#", keys.join(','));
    query = query.replace("#m#", conditions[0]);

    return [query, values];
  }

  function selectSQL(table, columns, conditions, options) {
    var query = 'SELECT #col# FROM ' + table + '#cond#', values = [];

    if (typeof columns === 'undefined') {
      columns = '*';
    } else if (typeof columns === 'object') {
      columns.join(',');
    }

    conditions = buildConditions(conditions);

    values = values.concat(conditions[1]);

    query = query.replace("#col#", columns);
    query = query.replace('#cond#', conditions[0]);

    if (options) {
      if (options.limit) {
        query = query + ' LIMIT ?';
        values.push(options.limit);
      }
      if (options.order) {
        query = query + ' ORDER BY ?';
        values.push(options.order);
      }
      if (options.offset) {
        query = query + ' OFFSET ?';
        values.push(options.offset);
      }
    }

    query = query + ';';

    return [query, values];
  }

  function destroySQL(table, conditions) {
    var query = 'DELETE FROM ' + table + '#c#;';

    conditions = buildConditions(conditions);

    query = query.replace('#c#', conditions[0]);

    return [query, conditions[1]];
  }

  return {
    createTable: function (name, cols) {
      return createTableSQL(name, cols);
      
    },
    dropTable: function (name) { 
      return dropTableSQL(name);
    },
    insert: function (table, map) {
      return insertSQL(table, map);
    },
    update: function (table, map, conditions) {
      return updateSQL(table, map, conditions);
    },
    select: function (table, columns, conditions, options) {
      return selectSQL(table, columns, conditions, options);
    },
    destroy: function (table, conditions) {
      return destroySQL(table, conditions);
    }
  };
}