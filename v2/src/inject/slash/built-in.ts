/**
 * Built-in slash command definitions.
 *
 * Ported from inject.js lines 21–395 (snuslashcommands) and enriched with
 * ConfigurableFilter declarations so every hardcoded query/parameter can be
 * overridden by the user through the Settings UI.
 *
 * Convention for urlTemplate variables:
 *   $0          – full user input after the command keyword
 *   $1, $2, …   – whitespace-split tokens
 *   $table      – current page's table name
 *   $sysid      – current record's sys_id
 *   $encodedquery – current list's encoded query
 *   {{key}}     – replaced by the resolved value of a ConfigurableFilter
 */

import type { SlashCommand } from '@shared/types/command';

export const BUILT_IN_COMMANDS: SlashCommand[] = [
  // ── Admin / scripting ──────────────────────────────────────────────────────
  {
    id: 'bg',
    label: 'Background Script',
    hint: 'Background Script',
    urlTemplate: 'sys.scripts.do',
    filters: [],
    tags: ['admin', 'scripts'],
  },
  {
    id: 'bgm',
    label: 'Background Script Modern',
    hint: 'Background Script Modern (Washington and up)',
    urlTemplate: 'sys.scripts.modern.do',
    filters: [],
    tags: ['admin', 'scripts'],
  },
  {
    id: 'bgc',
    label: 'Background Script (current)',
    hint: 'Background Script with var current',
    urlTemplate:
      '/sys.scripts.do?content=var%20current%20%3D%20new%20GlideRecord%28%22$table%22%29%3B%0Aif%20%28current.get%28%22$sysid%22%29%29%7B%0A%20%20%20%20gs.info%28current.getDisplayValue%28%29%29%3B%0A%7D',
    filters: [],
    tags: ['admin', 'scripts'],
  },
  {
    id: 'bgl',
    label: 'Background Script (list)',
    hint: 'Background Script with list gr',
    urlTemplate:
      '/sys.scripts.do?content=var%20list%20%3D%20new%20GlideRecord%28%22$table%22%29%3B%0Alist.addEncodedQuery%28%22$encodedquery%22%29%3B%0Alist.setLimit%2810%29%3B%0Alist.query%28%29%3B%0Awhile%20%28list.next%28%29%29%7B%0A%20%20%20%20gs.info%28list.getDisplayValue%28%29%29%3B%0A%7D',
    filters: [],
    tags: ['admin', 'scripts'],
  },
  {
    id: 'debug',
    label: 'Script Debugger',
    hint: 'Open Script Debugger',
    urlTemplate: '*',
    filters: [],
    tags: ['admin', 'scripts'],
  },

  // ── Navigation / search ────────────────────────────────────────────────────
  {
    id: 'start',
    label: 'New Tab',
    hint: 'New tab',
    urlTemplate: '/nav_to.do',
    filters: [],
    tags: ['navigation'],
  },
  {
    id: 'tab',
    label: 'Open Page',
    hint: 'New tab <page or portal ie. foo.do or csm>',
    urlTemplate: '/$0',
    filters: [],
    tags: ['navigation'],
  },
  {
    id: 'm',
    label: 'Menu Search',
    hint: 'All menu search (Next Experience only) <search>',
    urlTemplate: '*',
    filters: [],
    tags: ['navigation'],
    nextOnly: true,
  },
  {
    id: 'search',
    label: 'Global Search',
    hint: 'Global Instance Search <search>',
    urlTemplate: 'text_search_exact_match.do?sysparm_search=$0',
    filters: [],
    tags: ['navigation'],
  },
  {
    id: 'env',
    label: 'Open in Instance',
    hint: 'Open this page in <instance>',
    urlTemplate: '*',
    filters: [],
    tags: ['navigation'],
  },

  // ── Record actions ─────────────────────────────────────────────────────────
  {
    id: 'list',
    label: 'List View',
    hint: 'Open current record in list view',
    urlTemplate: '/$table_list.do?sysparm_query=sys_id=$sysid',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'xml',
    label: 'XML View',
    hint: "Open current record's XML view",
    urlTemplate: '/$table.do?XML=&sys_target=&sys_id=$sysid',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'xmlsrc',
    label: 'XML Source',
    hint: "Open current record's XML view with Browser's View Source",
    urlTemplate: '*',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'json',
    label: 'JSON View',
    hint: "Open current record's JSONv2 view",
    urlTemplate: '/$table.do?JSONv2&sysparm_action=get&sysparm_sys_id=$sysid',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'versions',
    label: 'Record Versions',
    hint: 'Versions of current record',
    urlTemplate:
      '/sys_update_version_list.do?sysparm_query=name=$table_$sysid^ORDERBYDESCsys_recorded_at',
    resultFields: 'sys_recorded_at,sys_created_by',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'vd',
    label: 'View Data',
    hint: 'View data of current record (-p for popup)',
    urlTemplate: '*',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'diff1',
    label: 'Diff Left',
    hint: 'Send XML of record to left side of diff viewer',
    urlTemplate: '*',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'diff2',
    label: 'Diff Right',
    hint: 'Send XML of record to right side of diff viewer',
    urlTemplate: '*',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'diffenv',
    label: 'Diff Env',
    hint: 'Compare current record XML with XML of <instance>',
    urlTemplate: '*',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'crn',
    label: 'Copy Record New',
    hint: 'Copy Record to New tab',
    urlTemplate:
      "javascript: (function () {\n\tif (!g_form) return;\n\tlet blacklistedFields = ['number','sys_scope'];\n\tlet newRecordURL = `/${g_form.getTableName()}.do?sys_id=-1`;\n\t " +
      "let queryParts = g_form.elements.reduce((acc, el) => {\n\t\tif (\n\t\t\tel.fieldName.startsWith('sys') ||\n\t\t\tblacklistedFields.includes(el.fieldName) ||\n\t\t\tel.fieldName.indexOf('.') !== -1\n\t\t)\n\t\t\treturn acc; " +
      "\n\t\tif (g_form.isFieldVisible(el.fieldName) && g_form.getValue(el.fieldName) !== '') {\n\t\t\tacc.push(`${el.fieldName}=${encodeURIComponent(g_form.getValue(el.fieldName))}`);\n\t\t}\n\t\treturn acc;\n\t}, []);" +
      "\n\tlet queryString = 'sysparm_query=' + queryParts.join('^');\n\tlet viewString = `sysparm_view=${encodeURIComponent(g_form.getViewName())}`;\n\twindow.open([newRecordURL, queryString, viewString].join('&'), '_blank');\n})();",
    filters: [],
    tags: ['record'],
  },
  {
    id: 'sysid',
    label: 'SysID Search',
    hint: 'Instance search <sys_id>',
    urlTemplate: '*',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'tsk',
    label: 'Open Task',
    hint: 'Open task <number>',
    urlTemplate: 'task.do?sysparm_refkey=name&sys_id=$0',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'rnd',
    label: 'Random Fill',
    hint: 'Fill empty mandatory fields',
    urlTemplate: '*',
    filters: [],
    tags: ['record'],
  },
  {
    id: 'um',
    label: 'UnMandatory',
    hint: 'UnMandatory; Set all mandatory fields to false (Admin only)',
    urlTemplate: 'javascript:snuSetAllMandatoryFieldsToFalse()',
    filters: [],
    tags: ['admin', 'record'],
  },
  {
    id: 'ois',
    label: 'Open in Studio',
    hint: 'Open record in open ServiceNow Studio tab',
    urlTemplate: '*',
    filters: [],
    tags: ['record', 'development'],
  },

  // ── Scripts / development ──────────────────────────────────────────────────
  {
    id: 'acl',
    label: 'ACL List',
    hint: 'Filter ACL list <table> <operation>',
    urlTemplate:
      'sys_security_acl_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'name',
    filters: [
      {
        key: 'query',
        label: 'Base encoded query',
        type: 'encoded_query',
        defaultValue: 'nameLIKE$1^operationLIKE$2',
        description:
          'Encoded query applied to the ACL list. $1 = table arg, $2 = operation arg.',
      },
    ],
    tags: ['security', 'admin'],
  },
  {
    id: 'br',
    label: 'Business Rules',
    hint: 'Filter Business Rules <name>',
    urlTemplate:
      'sys_script_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'name,collection',
    filters: [
      {
        key: 'query',
        label: 'Base encoded query',
        type: 'encoded_query',
        defaultValue: 'nameLIKE$0',
        description: 'Filter applied to Business Rules. $0 = search term.',
      },
    ],
    tags: ['scripts', 'development'],
  },
  {
    id: 'cs',
    label: 'Client Scripts',
    hint: 'Filter Client Scripts <name>',
    urlTemplate:
      'sys_script_client_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'name',
    filters: [
      {
        key: 'query',
        label: 'Base encoded query',
        type: 'encoded_query',
        defaultValue: 'nameLIKE$0',
      },
    ],
    tags: ['scripts', 'development'],
  },
  {
    id: 'si',
    label: 'Script Includes',
    hint: 'Filter Script Includes <name>',
    urlTemplate:
      'sys_script_include_list.do?sysparm_orderby=api_name&sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'api_name',
    filters: [
      {
        key: 'query',
        label: 'Base encoded query',
        type: 'encoded_query',
        defaultValue: 'api_nameLIKE$0',
      },
    ],
    tags: ['scripts', 'development'],
  },
  {
    id: 'uis',
    label: 'UI Scripts',
    hint: 'Filter UI Scripts <name>',
    urlTemplate:
      'sys_ui_script_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'name',
    filters: [
      {
        key: 'query',
        label: 'Base encoded query',
        type: 'encoded_query',
        defaultValue: 'nameLIKE$0',
      },
    ],
    tags: ['scripts', 'development'],
  },
  {
    id: 'ua',
    label: 'UI Actions',
    hint: 'Filter UI Actions <name>',
    urlTemplate:
      'sys_ui_action_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'name,table',
    filters: [
      {
        key: 'query',
        label: 'Base encoded query',
        type: 'encoded_query',
        defaultValue: 'nameLIKE$0',
      },
    ],
    tags: ['scripts', 'development'],
  },
  {
    id: 'up',
    label: 'UI Policies',
    hint: 'UI Policies <name>',
    urlTemplate:
      'sys_ui_policy_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'short_description,sys_updated_on',
    filters: [
      {
        key: 'query',
        label: 'Base encoded query',
        type: 'encoded_query',
        defaultValue: 'short_descriptionLIKE$0',
      },
    ],
    tags: ['development'],
  },

  // ── Update sets ────────────────────────────────────────────────────────────
  {
    id: 'su',
    label: 'Switch Update Set',
    hint: 'Switch Update set <name>',
    urlTemplate:
      'sys_update_set_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'name,sys_updated_on',
    inlineOverrideUrl: '#snu:switchto,updateset,sysId,$sysid',
    filters: [
      {
        key: 'query',
        label: 'Base encoded query',
        type: 'encoded_query',
        defaultValue:
          'state=in progress^application=javascript:gs.getCurrentApplicationId()^nameLIKE$0',
        description:
          'Filter for Update Sets. Remove the application clause if you want to see all scopes.',
      },
    ],
    tags: ['development', 'update-sets'],
  },

  // ── Applications / scopes ──────────────────────────────────────────────────
  {
    id: 'app',
    label: 'Applications',
    hint: 'Filter Applications <name>',
    urlTemplate:
      'sys_scope_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'name',
    filters: [
      {
        key: 'query',
        label: 'Base encoded query',
        type: 'encoded_query',
        defaultValue: 'nameLIKE$0^ORscopeLIKE$0',
      },
    ],
    tags: ['development'],
  },
  {
    id: 'sa',
    label: 'Switch Application',
    hint: 'Switch Application (10 most recent)',
    urlTemplate: '*',
    filters: [],
    tags: ['development'],
  },
  {
    id: 'plug',
    label: 'Plugins',
    hint: 'Filter Plugins <search>',
    urlTemplate: '$allappsmgmt.do?sysparm_search=$0',
    resultFields: 'id',
    filters: [],
    tags: ['admin'],
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  {
    id: 'u',
    label: 'Users',
    hint: 'Filter Users <search>',
    urlTemplate: 'sys_user_list.do?sysparm_query={{query}}',
    resultFields: 'user_name, name',
    filters: [
      {
        key: 'query',
        label: 'User filter query',
        type: 'encoded_query',
        defaultValue: 'user_nameLIKE$0^ORnameLIKE$0',
        description:
          'Encoded query applied to the user list. On large instances you may want to add a department or company filter.',
      },
    ],
    tags: ['users'],
  },
  {
    id: 'me',
    label: 'My Profile',
    hint: 'Open My User profile',
    urlTemplate: 'sys_user.do?sys_id=javascript:gs.getUserID()',
    filters: [],
    tags: ['users'],
  },
  {
    id: 'imp',
    label: 'Impersonate User',
    hint: 'Impersonate User',
    urlTemplate: '*',
    filters: [
      {
        key: 'query',
        label: 'User search query',
        type: 'encoded_query',
        defaultValue: 'active=true^nameSTARTSWITH',
        description:
          'Encoded query used when searching for a user to impersonate. ' +
          'On large user tables, add a more specific filter such as ' +
          '"active=true^company=<guid>" to avoid slow queries.',
      },
      {
        key: 'limit',
        label: 'Max results',
        type: 'number',
        defaultValue: 20,
        description: 'Maximum number of user results to return. Lower values are faster on large tables.',
      },
    ],
    tags: ['users', 'admin'],
  },
  {
    id: 'unimp',
    label: 'Stop Impersonating',
    hint: 'Stop impersonating and reload page',
    urlTemplate: '*',
    filters: [],
    tags: ['users'],
  },
  {
    id: 'elev',
    label: 'Elevate Role',
    hint: 'Toggle Security Admin role <role>',
    urlTemplate: '*',
    filters: [],
    tags: ['admin'],
  },
  {
    id: 'lang',
    label: 'Switch Language',
    hint: 'Switch language <lng>',
    urlTemplate: '*',
    filters: [],
    tags: ['admin'],
  },
  {
    id: 'sd',
    label: 'Switch Domain',
    hint: 'Switch Domain <name>',
    urlTemplate: 'domain_list.do?sysparm_query={{query}}^ORDERBYname',
    resultFields: 'name',
    inlineOverrideUrl: '#snu:switchto,domain,value,$sysid',
    filters: [
      {
        key: 'query',
        label: 'Domain search query',
        type: 'encoded_query',
        defaultValue: 'nameLIKE$0',
      },
    ],
    tags: ['admin'],
  },

  // ── Tables ─────────────────────────────────────────────────────────────────
  {
    id: 'tables',
    label: 'Tables',
    hint: 'Tables sys_db_object <search>',
    urlTemplate: 'sys_db_object_list.do?sysparm_query={{query}}^ORDERBYname',
    resultFields: 'label,name',
    filters: [
      {
        key: 'query',
        label: 'Table search query',
        type: 'encoded_query',
        defaultValue: 'sys_update_nameISNOTEMPTY^labelLIKE$0^ORnameLIKE$0',
        description:
          'Remove "sys_update_nameISNOTEMPTY^" to include OOB tables without update records.',
      },
    ],
    tags: ['development'],
  },
  {
    id: 'p',
    label: 'Properties',
    hint: 'Filter Properties <name>',
    urlTemplate: 'sys_properties_list.do?sysparm_query={{query}}',
    resultFields: 'name',
    filters: [
      {
        key: 'query',
        label: 'Property search query',
        type: 'encoded_query',
        defaultValue: 'nameLIKE$0',
      },
    ],
    tags: ['admin'],
  },

  // ── Logs ───────────────────────────────────────────────────────────────────
  {
    id: 'log',
    label: 'System Log',
    hint: 'Filter System Log Created Today <search>',
    urlTemplate: 'syslog_list.do?sysparm_query={{query}}',
    filters: [
      {
        key: 'query',
        label: 'Log filter query',
        type: 'encoded_query',
        defaultValue:
          'sys_created_onONToday@javascript:gs.daysAgoStart(0)@javascript:gs.daysAgoEnd(0)^messageLIKE$0^ORsourceLIKE$0',
        description:
          'Encoded query for the system log. You can broaden or narrow the date range here.',
      },
    ],
    tags: ['admin'],
  },
  {
    id: 'trans',
    label: 'Transaction Log',
    hint: 'Filter Transaction Log <search>',
    urlTemplate: 'syslog_transaction_list.do?sysparm_query={{query}}',
    filters: [
      {
        key: 'query',
        label: 'Transaction filter query',
        type: 'encoded_query',
        defaultValue:
          'sys_created_onONToday@javascript:gs.daysAgoStart(0)@javascript:gs.daysAgoEnd(0)^urlLIKE$0',
      },
    ],
    tags: ['admin'],
  },
  {
    id: 'cancel',
    label: 'Cancel Transactions',
    hint: 'Cancel My Running Transactions',
    urlTemplate: '/cancel_my_transactions.do',
    filters: [],
    tags: ['admin'],
  },

  // ── Service Portal ─────────────────────────────────────────────────────────
  {
    id: 'sp',
    label: 'Service Portal',
    hint: 'Service Portal',
    urlTemplate: '/sp',
    filters: [],
    tags: ['service-portal'],
  },
  {
    id: 'spw',
    label: 'SP Widgets',
    hint: 'Service Portal Widgets <search>',
    urlTemplate:
      'sp_widget_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'name',
    inlineOverrideUrl: '/sp_config?id=widget_editor&sys_id=$sysid',
    inlineOnly: true,
    filters: [
      {
        key: 'query',
        label: 'Widget search query',
        type: 'encoded_query',
        defaultValue: 'nameLIKE$0',
      },
    ],
    tags: ['service-portal', 'development'],
  },

  // ── UI Builder / Next Experience ───────────────────────────────────────────
  {
    id: 'uib',
    label: 'UI Builder',
    hint: 'Open UI Builder',
    urlTemplate: '/now/builder/ui/',
    filters: [],
    tags: ['development', 'next'],
    nextOnly: true,
  },
  {
    id: 'uibe',
    label: 'UIB Experience',
    hint: 'UIB Experience <search>',
    urlTemplate:
      '/sys_ux_page_registry_list.do?sysparm_query={{query}}^ORDERBYDESCsys_updated_on',
    resultFields: 'title,path,sys_id',
    inlineOverrideUrl: '/now/builder/ui/experience/$sys_id',
    filters: [
      {
        key: 'query',
        label: 'Experience search query',
        type: 'encoded_query',
        defaultValue:
          'root_macroponentISNOTEMPTY^sys_id!=3bfb334573021010e12d1e3014f6a7a9^sys_id!=8f30c79577af00108a370870a810613a^sys_id!=a36cd3837721201079ccdc3f581061b8^sys_id!=ec71a07477a2301079ccdc3f581061e9^titleLIKE$0^ORpathLIKE$0',
        description:
          'The default query excludes some OOB core experiences. Remove sys_id filters to include everything.',
      },
    ],
    tags: ['development', 'next'],
    nextOnly: true,
  },
  {
    id: 'uibo',
    label: 'Open Page in UIB',
    hint: 'Open page in UIB',
    urlTemplate: 'javascript: !function(){let e=(e,a,n)=>{if(parseInt(ux_globals?.libuxf?.version.split(".")[0])>22){var t=`/now/builder/ui/redirect/experience/params/base-id/${e}/page-sys-id/${a}/`;n&&(t+=`screen-id/${n}/`)}else{var t=`/now/build/ui/apps/${e}/pages/${a}/`;n&&(t+=`variants/${n}/`)}window.open(t,"_blank"),event&&event.stopPropagation()};(()=>{let a=ux_globals?.pageSettings?.sys_id?.value;if(!a){snuSlashCommandInfoText("Unable to locate app config, are you on a UX Page?");return}let n=ux_globals?.snCanvasScreen?.screenData;if(!n||!n.screenType){snuSlashCommandInfoText("Unable to locate screen collection, are you on a UX Page?");return}let t=window.location.pathname,r=ux_globals?.siteName,s=RegExp("^/"+r),i=r&&s.test(t);if(!i){snuSlashCommandInfoText("UX Globals are stale, please refresh the page.");return}let o=ux_globals?.snCanvasScreen?.screenData?.viewportConfigurationId;e(a,n?.screenType,o)})()}();',
    filters: [],
    tags: ['development', 'next'],
    nextOnly: true,
  },

  // ── Flow / Workflow ────────────────────────────────────────────────────────
  {
    id: 'fd',
    label: 'Flow Designer',
    hint: 'Open Flow Designer',
    urlTemplate: '/$flow-designer.do',
    filters: [],
    tags: ['automation'],
  },
  {
    id: 'wf',
    label: 'Workflow Editor',
    hint: 'Workflow Editor',
    urlTemplate: '/workflow_ide.do?sysparm_nostack=true',
    filters: [],
    tags: ['automation'],
  },
  {
    id: 'ws',
    label: 'Workflow Studio',
    hint: 'Workflow Studio',
    urlTemplate: '/now/workflow-studio/home/flow',
    filters: [],
    tags: ['automation'],
  },
  {
    id: 'pad',
    label: 'Process Automation Designer',
    hint: 'Process Automation Designer',
    urlTemplate: '/now/process/home',
    filters: [],
    tags: ['automation'],
  },
  {
    id: 'va',
    label: 'Virtual Agent',
    hint: 'Virtual Agent Designer',
    urlTemplate: '/$conversation-builder.do',
    filters: [],
    tags: ['automation'],
  },

  // ── Studios / builders ─────────────────────────────────────────────────────
  {
    id: 'st',
    label: 'Studio',
    hint: 'Open Studio',
    urlTemplate: '/$studio.do',
    filters: [],
    tags: ['development'],
  },
  {
    id: 'sns',
    label: 'ServiceNow Studio',
    hint: 'ServiceNow Studio',
    urlTemplate: '/now/servicenow-studio',
    filters: [],
    tags: ['development'],
  },
  {
    id: 'aes',
    label: 'App Engine Studio',
    hint: 'Open App Engine Studio',
    urlTemplate: '/now/appenginestudio',
    filters: [],
    tags: ['development'],
  },
  {
    id: 'mab',
    label: 'Mobile App Builder',
    hint: 'Mobile Application Builder',
    urlTemplate: '/now/mobile-app-builder',
    filters: [],
    tags: ['development'],
  },
  {
    id: 'sow',
    label: 'Service Operations Workspace',
    hint: 'Service Operations Workspace',
    urlTemplate: '/now/sow/home',
    filters: [],
    tags: ['navigation'],
  },
  {
    id: 'ec',
    label: 'Employee Center',
    hint: 'Employee Center',
    urlTemplate: '/esc',
    filters: [],
    tags: ['navigation'],
  },
  {
    id: 'db',
    label: 'Dashboards',
    hint: 'Dashboards',
    urlTemplate: '$pa_dashboard.do',
    filters: [],
    tags: ['navigation'],
  },
  {
    id: 'naa',
    label: 'Now Assist Agents',
    hint: 'Now Assist ai Agents studio',
    urlTemplate: 'now/agent-studio/overview',
    filters: [],
    tags: ['ai'],
  },
  {
    id: 'nas',
    label: 'Now Assist Skill Kit',
    hint: 'Now Assist Skill kit',
    urlTemplate: 'now/now-assist-skillkit/skills',
    filters: [],
    tags: ['ai'],
  },

  // ── Code / search ──────────────────────────────────────────────────────────
  {
    id: 'code',
    label: 'Code Search',
    hint: 'Code Search <search>',
    urlTemplate: '*',
    filters: [],
    tags: ['development'],
  },
  {
    id: 'api',
    label: 'API Reference',
    hint: 'Search Developer References <search>',
    urlTemplate:
      'https://developer.servicenow.com/dev.do#!/search/aspen/Reference/$0',
    filters: [],
    tags: ['reference'],
  },
  {
    id: 'dev',
    label: 'Developer Portal',
    hint: 'Search developer portal <search>',
    urlTemplate:
      'https://developer.servicenow.com/dev.do#!/search/yokohama/All/$0',
    filters: [
      {
        key: 'release',
        label: 'Documentation release',
        type: 'text',
        defaultValue: 'yokohama',
        description:
          'ServiceNow release name to scope the developer portal search.',
      },
    ],
    tags: ['reference'],
  },
  {
    id: 'docs',
    label: 'Docs Search',
    hint: 'Search Docs <search>',
    urlTemplate:
      'https://www.servicenow.com/docs/search?labelkey={{release}}&q=$0',
    filters: [
      {
        key: 'release',
        label: 'Documentation release',
        type: 'text',
        defaultValue: 'yokohama',
        description: 'ServiceNow release name to scope the docs search.',
      },
    ],
    tags: ['reference'],
  },
  {
    id: 'comm',
    label: 'Community Search',
    hint: 'Search Community <search>',
    urlTemplate:
      'https://www.servicenow.com/community/forums/searchpage/tab/message?advanced=false&allow_punctuation=false&q=$0',
    filters: [],
    tags: ['reference'],
  },
  {
    id: 'cheat',
    label: 'Cheatsheet',
    hint: 'Download the latest SN Utils cheatsheet',
    urlTemplate: 'https://www.arnoudkooi.com/cheatsheet/',
    filters: [],
    tags: ['reference'],
  },
  {
    id: 'tweets',
    label: 'SN Utils Tweets',
    hint: 'Search @sn_utils Tweets <search>',
    urlTemplate:
      'https://twitter.com/search?q=from%3Asn_utils%20$0&src=typed_query&f=live',
    filters: [],
    tags: ['reference'],
  },

  // ── UI / display ───────────────────────────────────────────────────────────
  {
    id: 'tn',
    label: 'Technical Names',
    hint: 'Show Technical Names',
    urlTemplate: '*',
    filters: [],
    tags: ['ui'],
  },
  {
    id: 'uh',
    label: 'Show Hidden Fields',
    hint: 'Show Hidden Fields',
    urlTemplate: '*',
    filters: [],
    tags: ['ui'],
  },
  {
    id: 'pop',
    label: 'Pop In/Out',
    hint: 'Pop in/out classic UI',
    urlTemplate: '*',
    filters: [],
    tags: ['ui'],
  },
  {
    id: 'ppt',
    label: 'Polaris Picker Test',
    hint: 'Polaris Picker Test :)',
    urlTemplate: '*',
    filters: [],
    tags: ['ui'],
    hidden: true,
  },
  {
    id: 's2',
    label: 'Toggle Select2',
    hint: 'Toggle Select2 for Application and update set picker',
    urlTemplate: '*',
    filters: [],
    tags: ['ui'],
  },
  {
    id: 'itt',
    label: 'Instance Tag Toggle',
    hint: 'InstanceTag Toggle',
    urlTemplate: '*',
    filters: [],
    tags: ['ui'],
  },
  {
    id: 'cls',
    label: 'Clear Local Storage',
    hint: 'Clear Local Storage',
    urlTemplate: '*',
    filters: [],
    tags: ['admin'],
  },
  {
    id: 'copycells',
    label: 'Copy Cell Values',
    hint: 'Copy Selected Cell Values from List [-s for SysIDs]',
    urlTemplate: '*',
    filters: [],
    tags: ['ui'],
  },
  {
    id: 'copycolumn',
    label: 'Copy Column Values',
    hint: 'Copy All Values from Selected Column [-s for SysIDs]',
    urlTemplate: '*',
    filters: [],
    tags: ['ui'],
  },

  // ── VS Code / Token ────────────────────────────────────────────────────────
  {
    id: 'token',
    label: 'Send Token to VS Code',
    hint: 'Send g_ck token to VS Code',
    urlTemplate: '*',
    filters: [],
    tags: ['vscode'],
  },

  // ── Help ───────────────────────────────────────────────────────────────────
  {
    id: 'help',
    label: 'SN Utils Help',
    hint: 'Open SN Utils info page',
    urlTemplate: '*',
    filters: [],
    tags: ['help'],
  },

  // ── Special / system ───────────────────────────────────────────────────────
  {
    id: 'shortcut',
    label: 'Keyboard Shortcut',
    hint: 'Special slashcommand, accessible via extension keyboard shortcut',
    urlTemplate: '//sa',
    filters: [],
    hidden: true,
  },
];

/** Quick lookup map — built once at module load time */
export const BUILT_IN_COMMAND_MAP: ReadonlyMap<string, SlashCommand> = new Map(
  BUILT_IN_COMMANDS.map((cmd) => [cmd.id, cmd])
);
