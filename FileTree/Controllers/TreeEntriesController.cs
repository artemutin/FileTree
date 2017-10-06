using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using FileTree.Models;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Threading;

namespace FileTree.Controllers
{
    public class TreeEntriesController : Controller
    {
        private FileTreeContext db = new FileTreeContext();

        // GET: TreeEntries
        public ActionResult Index()
        {
            var fileTree = db.TreeEntries.Where(x => x.Id == 1);
            
            return Json(
                JsonConvert.SerializeObject(fileTree,
                    new JsonSerializerSettings {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented})
                , JsonRequestBehavior.AllowGet
                );
        }

        // POST: TreeEntries/Move/?movedId=1&newParentId=2&position=0
        [HttpPost]
        public ActionResult Move(int movedId, int newParentId, int position)
        {
            try
            {
                var movedTreeEntry = db.TreeEntries.Where(x => x.Id == movedId).Single();
                var newParent = db.TreeEntries.Where(x => x.Id == newParentId).Single();
                movedTreeEntry.RemoveFromParent();
                newParent.AddChild(movedTreeEntry, position);
                db.SaveChanges();
                Thread.Sleep(1000);

                return new HttpStatusCodeResult(200);
            }catch(Exception e)
            {
                return new HttpStatusCodeResult(400, e.Message);
                throw e;
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
